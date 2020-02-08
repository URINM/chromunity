import React from "react";
import { styled } from "@material-ui/core/styles";
import { ChromunityUser, Topic } from "../../types";
import { Container, LinearProgress, MenuItem, Select } from "@material-ui/core";
import TopicOverviewCard from "../topic/TopicOverviewCard";
import NewTopicButton from "../buttons/NewTopicButton";
import LoadMoreButton from "../buttons/LoadMoreButton";
import { TrendingChannels } from "../tags/TrendingTags";
import ChromiaPageHeader from "../common/ChromiaPageHeader";
import { getMutedUsers } from "../../blockchain/UserService";
import { TOPIC_VIEW_SELECTOR_OPTION } from "./WallCommon";
import { getUser } from "../../util/user-util";
import { ApplicationState } from "../../store";
import {
  loadAllTopicsByPopularity,
  loadAllTopicWall,
  loadFollowedChannelsTopicsByPopularity,
  loadFollowedChannelsTopicWall,
  loadFollowedUsersTopicsByPopularity,
  loadFollowedUsersTopicWall,
  loadOlderAllTopics,
  loadOlderFollowedChannelsTopics,
  loadOlderFollowedUsersTopics
} from "./redux/wallActions";
import { connect } from "react-redux";
import { toLowerCase } from "../../util/util";

interface Props {
  type: string;
  loading: boolean;
  topics: Topic[];
  couldExistOlderTopics: boolean;
  representatives: string[];
  loadAllTopics: typeof loadAllTopicWall;
  loadOlderTopics: typeof loadOlderAllTopics;
  loadAllTopicsByPopularity: typeof loadAllTopicsByPopularity;
  loadFollowedUsersTopics: typeof loadFollowedUsersTopicWall;
  loadOlderFollowedUsersTopics: typeof loadOlderFollowedUsersTopics;
  loadFollowedUsersTopicsByPopularity: typeof loadFollowedUsersTopicsByPopularity;
  loadFollowedChannelsTopics: typeof loadFollowedChannelsTopicWall;
  loadOlderFollowedChannelsTopics: typeof loadOlderFollowedChannelsTopics;
  loadFollowedChannelsTopicsByPopularity: typeof loadFollowedChannelsTopicsByPopularity;
}

interface State {
  selector: TOPIC_VIEW_SELECTOR_OPTION;
  popularSelector: TOPIC_VIEW_SELECTOR_OPTION;
  mutedUsers: string[];
  user: ChromunityUser;
}

const StyledSelector = styled(Select)(style => ({
  color: style.theme.palette.primary.main,
  float: "left",
  marginRight: "10px"
}));

const topicsPageSize: number = 15;

class TopicWall extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      selector: TOPIC_VIEW_SELECTOR_OPTION.RECENT,
      popularSelector: TOPIC_VIEW_SELECTOR_OPTION.POPULAR_WEEK,
      mutedUsers: [],
      user: getUser()
    };

    this.retrieveLatestTopics = this.retrieveLatestTopics.bind(this);
    this.retrieveOlderTopics = this.retrieveOlderTopics.bind(this);
    this.handleSelectorChange = this.handleSelectorChange.bind(this);
    this.handlePopularChange = this.handlePopularChange.bind(this);
  }

  componentDidMount() {
    if (this.state.user != null) {
      getMutedUsers(this.state.user).then(users => this.setState({ mutedUsers: users }));
    }
    this.retrieveLatestTopics(false);
  }

  render() {
    return (
      <div>
        <Container fixed>
          <ChromiaPageHeader text={this.getHeader()} />
          {this.props.loading ? <LinearProgress variant="query" /> : <div />}
          {this.props.type === "tagFollowings" ? <TrendingChannels /> : <div />}
          {this.props.type === "tagFollowings" ? <ChromiaPageHeader text="Followed Channels" /> : <div />}
          <StyledSelector value={this.state.selector} onChange={this.handleSelectorChange}>
            <MenuItem value={TOPIC_VIEW_SELECTOR_OPTION.RECENT}>Recent</MenuItem>
            <MenuItem value={TOPIC_VIEW_SELECTOR_OPTION.POPULAR}>Popular</MenuItem>
          </StyledSelector>
          {this.state.selector === TOPIC_VIEW_SELECTOR_OPTION.POPULAR ? (
            <StyledSelector value={this.state.popularSelector} onChange={this.handlePopularChange}>
              <MenuItem value={TOPIC_VIEW_SELECTOR_OPTION.POPULAR_DAY}>Last day</MenuItem>
              <MenuItem value={TOPIC_VIEW_SELECTOR_OPTION.POPULAR_WEEK}>Last week</MenuItem>
              <MenuItem value={TOPIC_VIEW_SELECTOR_OPTION.POPULAR_MONTH}>Last month</MenuItem>
              <MenuItem value={TOPIC_VIEW_SELECTOR_OPTION.POPULAR_ALL_TIME}>All time</MenuItem>
            </StyledSelector>
          ) : (
            <div />
          )}
          <br />
          <br />
          {this.props.topics.map(topic => {
            if (!this.state.mutedUsers.includes(topic.author) && !topic.removed) {
              return <TopicOverviewCard key={"card-" + topic.id} topic={topic} />;
            } else {
              return <div />;
            }
          })}
          {this.renderLoadMoreButton()}
        </Container>
        {this.state.user != null ? (
          <NewTopicButton channel="" updateFunction={() => this.retrieveLatestTopics(true)} />
        ) : (
          <div />
        )}
      </div>
    );
  }

  renderLoadMoreButton() {
    if (this.props.couldExistOlderTopics) {
      return <LoadMoreButton onClick={this.retrieveOlderTopics} />;
    }
  }

  getHeader() {
    if (this.props.type === "userFollowings") {
      return "Followed Users";
    } else if (this.props.type === "tagFollowings") {
      return "Trending Channels";
    } else {
      return "All Topics";
    }
  }

  handleSelectorChange(event: React.ChangeEvent<{ value: unknown }>) {
    const selected = event.target.value as TOPIC_VIEW_SELECTOR_OPTION;

    if (this.state.selector !== selected) {
      this.setState({ selector: selected });

      if (selected === TOPIC_VIEW_SELECTOR_OPTION.RECENT) {
        this.retrieveLatestTopics(false);
      } else if (selected === TOPIC_VIEW_SELECTOR_OPTION.POPULAR) {
        this.retrievePopularTopics(selected);
      }
    }
  }

  handlePopularChange(event: React.ChangeEvent<{ value: unknown }>) {
    const selected = event.target.value as TOPIC_VIEW_SELECTOR_OPTION;

    if (this.state.popularSelector !== selected) {
      this.setState({ popularSelector: selected });
      this.retrievePopularTopics(selected);
    }
  }

  retrieveLatestTopics(ignoreCache: boolean) {
    if (this.props.type === "userFollowings" && this.state.user) {
      this.props.loadFollowedUsersTopics(this.state.user.name, topicsPageSize);
    } else if (this.props.type === "tagFollowings" && this.state.user) {
      this.props.loadFollowedChannelsTopics(this.state.user.name, topicsPageSize, ignoreCache);
    } else {
      this.props.loadAllTopics(topicsPageSize, ignoreCache);
    }
  }

  retrievePopularTopics(selected: TOPIC_VIEW_SELECTOR_OPTION) {
    const dayInMilliSeconds: number = 86400000;
    let timestamp: number;

    switch (selected) {
      case TOPIC_VIEW_SELECTOR_OPTION.POPULAR_DAY:
        timestamp = Date.now() - dayInMilliSeconds;
        break;
      case TOPIC_VIEW_SELECTOR_OPTION.POPULAR:
      case TOPIC_VIEW_SELECTOR_OPTION.POPULAR_WEEK:
        timestamp = Date.now() - dayInMilliSeconds * 7;
        break;
      case TOPIC_VIEW_SELECTOR_OPTION.POPULAR_MONTH:
        timestamp = Date.now() - dayInMilliSeconds * 30;
        break;
      default:
        timestamp = 0;
        break;
    }

    if (this.props.type === "userFollowings") {
      this.props.loadFollowedUsersTopicsByPopularity(this.state.user.name, timestamp, topicsPageSize);
    } else if (this.props.type === "tagFollowings") {
      this.props.loadFollowedChannelsTopicsByPopularity(this.state.user.name, timestamp, topicsPageSize);
    } else {
      this.props.loadAllTopicsByPopularity(timestamp, topicsPageSize);
    }
  }

  retrieveOlderTopics() {
    if (this.props.topics.length > 0) {
      if (this.props.type === "userFollowings") {
        this.props.loadOlderFollowedUsersTopics(this.state.user.name, topicsPageSize);
      } else if (this.props.type === "tagFollowings") {
        this.props.loadOlderFollowedChannelsTopics(this.state.user.name, topicsPageSize);
      } else {
        this.props.loadOlderTopics(topicsPageSize);
      }
    }
  }
}

const mapDispatchToProps = (dispatch: any) => {
  return {
    loadAllTopics: (pageSize: number, ignoreCache: boolean) => dispatch(loadAllTopicWall(pageSize, ignoreCache)),
    loadOlderTopics: (pageSize: number) => dispatch(loadOlderAllTopics(pageSize)),
    loadAllTopicsByPopularity: (timestamp: number, pageSize: number) =>
      dispatch(loadAllTopicsByPopularity(timestamp, pageSize)),
    loadFollowedUsersTopics: (username: string, pageSize: number) =>
      dispatch(loadFollowedUsersTopicWall(username, pageSize)),
    loadOlderFollowedUsersTopics: (username: string, pageSize: number) =>
      dispatch(loadOlderFollowedUsersTopics(username, pageSize)),
    loadFollowedUsersTopicsByPopularity: (username: string, timestamp: number, pageSize: number) =>
      dispatch(loadFollowedUsersTopicsByPopularity(username, timestamp, pageSize)),
    loadFollowedChannelsTopics: (username: string, pageSize: number, ignoreCache: boolean) =>
      dispatch(loadFollowedChannelsTopicWall(username, pageSize, ignoreCache)),
    loadOlderFollowedChannelsTopics: (username: string, pageSize: number) =>
      dispatch(loadOlderFollowedChannelsTopics(username, pageSize)),
    loadFollowedChannelsTopicsByPopularity: (username: string, timestamp: number, pageSize: number) =>
      dispatch(loadFollowedChannelsTopicsByPopularity(username, timestamp, pageSize))
  };
};

const mapStateToProps = (store: ApplicationState) => {
  return {
    topics: store.topicWall.topics,
    loading: store.topicWall.loading,
    couldExistOlderTopics: store.topicWall.couldExistOlder,
    representatives: store.government.representatives.map(rep => toLowerCase(rep))
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(TopicWall);
