/* eslint-disable no-restricted-syntax */
import { runSaga } from 'redux-saga';
import { Action } from 'redux';
import { WallActionTypes, WallType, IUpdateTopics } from './wall-types';
import { ChromunityUser, Topic } from '../../../types';
import { createLoggedInUser } from '../../../shared/test-utility/users';
import { createRandomTopic } from '../../../shared/test-utility/topics';
import { loadFollowedChannelsTopicsSaga, loadOlderFollowedChannelsTopicsSaga } from './wall-sagas';
import { followChannel } from '../../../core/services/channel-service';
import { getANumber } from '../../../shared/test-utility/helper';
import logger from '../../../shared/util/logger';

describe('Topic wall [FOLLOWED CHANNELS] saga tests', () => {
  const testPrefix = 'load followed channels topics wall';
  const pageSize = 2;

  let user: ChromunityUser;

  jest.setTimeout(30000);

  function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  const createFakeStore = (dispatchedActions: any[], state: any) => {
    return {
      dispatch: (action: any) => dispatchedActions.push(action),
      getState: () => ({ topicWall: state }),
    };
  };

  const getUpdateTopicAction = (dispatchedActions: any[]): IUpdateTopics => {
    for (const action of dispatchedActions) {
      if (action.type === WallActionTypes.UPDATE_TOPICS_WALL) return action.payload;
    }
    return null;
  };

  const createFakeTopics = (timestamp: number): Topic[] => {
    return [
      {
        id: `id-${getANumber()}`,
        author: 'author',
        title: 'title',
        message: 'message',
        timestamp,
        last_modified: timestamp,
        latest_poster: 'author',
        moderated_by: [],
      },
    ];
  };

  const getUpdateTopicsFromCacheAction = (dispatchedActions: any[]): WallType => {
    logger.debug('Actions: ', dispatchedActions);
    expect(dispatchedActions.length).toBe(1);
    const action = dispatchedActions[0];
    expect(action.type).toBe(WallActionTypes.UPDATE_TOPICS_WALL_FROM_CACHE);
    return action.payload;
  };

  beforeAll(async (done) => {
    const channel = 'AnotherTestChannel';
    user = await createLoggedInUser();

    await Array.from({ length: pageSize }).forEach(async () => {
      await createRandomTopic(user, channel);
    });

    await followChannel(user, channel);
    await sleep(5000);
    done();
  });

  it(testPrefix, async () => {
    const dispatchedActions: any[] = [];
    const fakeStore = createFakeStore(dispatchedActions, {
      followedChannels: {
        updated: 0,
        topics: [],
      },
    });

    await runSaga(fakeStore, loadFollowedChannelsTopicsSaga, {
      type: WallActionTypes.LOAD_FOLLOWED_CHANNELS_TOPIC_WALL,
      payload: {
        username: user.name,
        pageSize,
        ignoreCache: false,
      },
    } as Action).toPromise();

    const updateTopicsAction = getUpdateTopicAction(dispatchedActions);

    expect(updateTopicsAction.topics.length).toBe(pageSize);
    expect(updateTopicsAction.couldExistOlder).toBe(true);
    expect(updateTopicsAction.wallType).toBe(WallType.CHANNEL);
  });

  it(`${testPrefix} | returns less than page size`, async () => {
    const dispatchedActions: any[] = [];
    const fakeStore = createFakeStore(dispatchedActions, {
      followedChannels: {
        updated: 0,
        topics: [],
      },
    });

    await runSaga(fakeStore, loadFollowedChannelsTopicsSaga, {
      type: WallActionTypes.LOAD_FOLLOWED_CHANNELS_TOPIC_WALL,
      payload: {
        username: user.name,
        pageSize: 1000,
        ignoreCache: false,
      },
    } as Action).toPromise();

    const updateTopicsAction = getUpdateTopicAction(dispatchedActions);

    expect(updateTopicsAction.topics.length).toBeLessThan(1000);
    expect(updateTopicsAction.couldExistOlder).toBe(false);
    expect(updateTopicsAction.wallType).toBe(WallType.CHANNEL);
  });

  it(`${testPrefix} | older loaded`, async () => {
    const dispatchedActions: any[] = [];
    const fakeStore = createFakeStore(dispatchedActions, {
      wallType: WallType.CHANNEL,
      followedChannels: {
        topics: createFakeTopics(0),
        updated: 0,
        couldExistOlder: true,
      },
    });

    await runSaga(fakeStore, loadFollowedChannelsTopicsSaga, {
      type: WallActionTypes.LOAD_FOLLOWED_CHANNELS_TOPIC_WALL,
      payload: {
        username: user.name,
        pageSize,
        ignoreCache: false,
      },
    } as Action).toPromise();

    const updateTopicsAction = getUpdateTopicAction(dispatchedActions);

    logger.debug('topics: ', updateTopicsAction.topics);

    expect(updateTopicsAction.topics.length).toBe(pageSize + 1);
    expect(updateTopicsAction.couldExistOlder).toBe(true);
    expect(updateTopicsAction.wallType).toBe(WallType.CHANNEL);
  });

  it(`${testPrefix} | load older`, async () => {
    const dispatchedActions: any[] = [];
    const fakeStore = createFakeStore(dispatchedActions, {
      wallType: WallType.CHANNEL,
      followedChannels: {
        topics: createFakeTopics(Date.now()),
        updated: 0,
      },
    });

    await runSaga(fakeStore, loadOlderFollowedChannelsTopicsSaga, {
      type: WallActionTypes.LOAD_OLDER_FOLLOWED_CHANNELS_TOPICS,
      payload: {
        username: user.name,
        pageSize,
      },
    } as Action).toPromise();

    const updateTopicsAction = getUpdateTopicAction(dispatchedActions);

    expect(updateTopicsAction.topics.length).toBe(pageSize + 1);
    expect(updateTopicsAction.couldExistOlder).toBe(true);
    expect(updateTopicsAction.wallType).toBe(WallType.CHANNEL);
  });

  it(`${testPrefix} | from cache`, async () => {
    const dispatchedActions: any[] = [];
    const fakeStore = createFakeStore(dispatchedActions, {
      wallType: WallType.CHANNEL,
      followedChannels: {
        topics: createFakeTopics(Date.now()),
        updated: Date.now(),
      },
    });

    await runSaga(fakeStore, loadFollowedChannelsTopicsSaga, {
      type: WallActionTypes.LOAD_FOLLOWED_CHANNELS_TOPIC_WALL,
      payload: {
        username: user.name,
        pageSize,
        ignoreCache: false,
      },
    } as Action).toPromise();

    const action = getUpdateTopicsFromCacheAction(dispatchedActions);
    expect(action).toBe(WallType.CHANNEL);
  });
});
