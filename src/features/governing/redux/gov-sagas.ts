import { put, select, takeLatest } from 'redux-saga/effects';
import { Action } from '@reduxjs/toolkit';
import ApplicationState from '../../../core/application-state';
import { ChromunityUser, Topic, RepresentativeReport } from '../../../types';
import logger from '../../../shared/util/logger';
import {
  getAllRepresentativeActionsPriorToTimestamp,
  getRepresentatives,
  getReports,
  getPinnedTopicId,
  getPinnedTopicByRep,
  pinTopic,
} from '../../../core/services/representatives-service';
import {
  updateActiveElection,
  updateLogbookRecentEntryTimestamp,
  updateReports,
  updateRepresentatives,
  updatePinnedTopic,
  updatePinnedTopicByRep,
  checkActiveElection,
  checkNewLogbookEntries,
  pinTopic as pinTopicAction,
} from './gov-actions';

import { GovernmentActionTypes } from './gov-types';
import { getUncompletedElection, processElection } from '../../../core/services/election-service';
import { toLowerCase } from '../../../shared/util/util';
import { setOperationPending } from '../../../shared/redux/common-actions';
import { getTopicById } from '../../../core/services/topic-service';
import * as config from '../../../config';

export function* governmentWatcher() {
  yield takeLatest(GovernmentActionTypes.LOAD_REPRESENTATIVES, getCurrentRepresentativesSaga);
  yield takeLatest(GovernmentActionTypes.LOAD_REPORTS, retrieveReportsSaga);
  yield takeLatest(GovernmentActionTypes.CHECK_ACTIVE_ELECTION, checkActiveElectionSaga);
  yield takeLatest(GovernmentActionTypes.CHECK_LOGBOOK_ENTRIES, checkLogbookEntriesSaga);
  yield takeLatest(GovernmentActionTypes.CHECK_PINNED_TOPIC, checkPinnedTopicSaga);
  yield takeLatest(GovernmentActionTypes.CHECK_PINNED_TOPIC_BY_REP, checkPinnedTopicByRepSaga);
  yield takeLatest(GovernmentActionTypes.PIN_TOPIC, pinTopicSaga);
}

const CACHE_DURATION_MILLIS = 1000 * 60 * 5;

const getRepresentativesLastUpdated = (state: ApplicationState) => state.government.representativesLastUpdated;
const getUnhandledReportsLastUpdated = (state: ApplicationState) => state.government.reportsLastUpdated;
const getActiveElectionLastUpdated = (state: ApplicationState) => state.government.activeElectionLastUpdated;
const getLogbookLastUpdated = (state: ApplicationState) => state.government.lastNewLogbookCheck;
const getRepresentativesCached = (state: ApplicationState) => state.government.representatives;
const pinnedTopic = (state: ApplicationState) => state.government.pinnedTopic;
const getPinnedLastChecked = (state: ApplicationState) => state.government.pinnedTopicLastChecked;
const topicIdPinnedByMe = (state: ApplicationState) => state.government.topicIdPinnedByMe;
const getUser = (state: ApplicationState) => state.account.user;
const representatives = (state: ApplicationState) => state.government.representatives;

const cacheExpired = (updated: number): boolean => {
  return Date.now() - updated > CACHE_DURATION_MILLIS;
};

export function* pinTopicSaga(action: Action) {
  if (pinTopicAction.match(action)) {
    yield put(setOperationPending(true));
    const user: ChromunityUser = yield select(getUser);
    yield pinTopic(user, action.payload);
    yield put(updatePinnedTopicByRep(action.payload));
    yield put(setOperationPending(false));
  }
}

export function* checkPinnedTopicSaga() {
  if (!config.features.pinEnabled) return;

  const topic: Topic = yield select(pinnedTopic);
  const lastChecked: number = yield select(getPinnedLastChecked);
  const user: ChromunityUser = yield select(getUser);

  if (topic == null && cacheExpired(lastChecked)) {
    const topicId = yield getPinnedTopicId(user ? user.name : null);
    if (topicId) {
      const t = yield getTopicById(topicId, user);
      yield put(updatePinnedTopic(t));
    }
  }
}

export function* checkPinnedTopicByRepSaga() {
  if (!config.features.pinEnabled) return;

  const user: ChromunityUser = yield select(getUser);
  const topicId: string = yield select(topicIdPinnedByMe);
  const reps: string[] = yield select(representatives);

  if (topicId == null && user && reps && reps.map((n) => toLowerCase(n).includes(toLowerCase(user.name)))) {
    const id = yield getPinnedTopicByRep(user.name);
    yield put(updatePinnedTopicByRep(id || ''));
  }
}

export function* getCurrentRepresentativesSaga() {
  const lastUpdated = yield select(getRepresentativesLastUpdated);

  if (cacheExpired(lastUpdated)) {
    const r: string[] = yield getRepresentatives();
    if (r != null) {
      yield put(updateRepresentatives(r));
    }
  }
}

export function* retrieveReportsSaga() {
  const lastUpdated = yield select(getUnhandledReportsLastUpdated);

  if (cacheExpired(lastUpdated)) {
    const reports: RepresentativeReport[] = yield getReports();
    yield put(updateReports(reports));
  }
}

export function* checkActiveElectionSaga(action: Action) {
  if (checkActiveElection.match(action)) {
    const lastUpdated = yield select(getActiveElectionLastUpdated);

    if (cacheExpired(lastUpdated)) {
      if (action.payload != null) {
        yield processElection(action.payload).catch((error: Error) =>
          logger.debug('Error while processing election, probably expected', error)
        );
      }
      const electionId = yield getUncompletedElection();
      yield put(updateActiveElection(electionId != null));
    }
  }
}

export function* checkLogbookEntriesSaga(action: Action) {
  if (checkNewLogbookEntries.match(action)) {
    const lastRead = yield select(getLogbookLastUpdated);
    const r: string[] = yield select(getRepresentativesCached);

    if (
      action.payload != null &&
      r != null &&
      cacheExpired(lastRead) &&
      r.map((rep) => toLowerCase(rep)).includes(toLowerCase(action.payload.name))
    ) {
      const logs = yield getAllRepresentativeActionsPriorToTimestamp(Date.now(), 1);
      yield put(updateLogbookRecentEntryTimestamp(logs.length > 0 ? logs[0].timestamp : Date.now()));
    }
  }
}
