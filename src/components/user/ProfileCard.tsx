import React from "react";
import {
  Badge,
  Button,
  Card,
  createStyles,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Tooltip,
  withStyles,
  WithStyles
} from "@material-ui/core";
import Typography from "@material-ui/core/Typography";

import {
  Favorite,
  Inbox,
  ReplyAll,
  StarRate,
  SupervisedUserCircle,
  VoiceOverOff,
  VolumeOff,
  VolumeUp,
  SentimentVeryDissatisfiedSharp
} from "@material-ui/icons";
import IconButton from "@material-ui/core/IconButton";
import {
  amIAFollowerOf,
  countUserFollowers,
  countUserFollowings,
  createFollowing,
  removeFollowing
} from "../../blockchain/FollowingService";

import {
  countRepliesByUser,
  countReplyStarRatingForUser,
  countTopicsByUser,
  countTopicStarRatingForUser
} from "../../blockchain/TopicService";

import { ifEmptyAvatarThenPlaceholder } from "../../util/user-util";
import { ChromunityUser } from "../../types";
import { getMutedUsers, getUserSettingsCached, isRegistered, toggleUserMute } from "../../blockchain/UserService";
import {
  distrustAnotherRepresentative,
  hasReportId,
  isRepresentativeDistrustedByMe,
  SUSPEND_USER_OP_ID,
  suspendUser
} from "../../blockchain/RepresentativesService";
import ChromiaPageHeader from "../common/ChromiaPageHeader";
import { COLOR_RED, COLOR_STEEL_BLUE } from "../../theme";
import Avatar, { AVATAR_SIZE } from "../common/Avatar";
import { NotFound } from "../static/NotFound";
import { ApplicationState } from "../../store";
import { connect } from "react-redux";
import { toLowerCase } from "../../util/util";
import { clearTopicsCache } from "../walls/redux/wallActions";

const styles = createStyles({
  iconRed: {
    color: COLOR_RED
  },
  iconBlue: {
    color: COLOR_STEEL_BLUE
  },
  contentWrapper: {
    float: "left",
    marginTop: "10px",
    marginLeft: "10px",
    marginRight: "10px"
  },
  description: {
    marginRight: "12px",
    marginTop: "5px",
    marginLeft: "10px"
  },
  bottomBar: {
    float: "right",
    marginBottom: "5px",
    marginTop: "5px"
  }
});

interface ProfileCardProps extends WithStyles<typeof styles> {
  username: string;
  representatives: string[];
  user: ChromunityUser;
  clearTopicsCache: typeof clearTopicsCache;
}

interface ProfileCardState {
  registered: boolean;
  following: boolean;
  followers: number;
  userFollowings: number;
  countOfTopics: number;
  countOfReplies: number;
  topicStars: number;
  replyStars: number;
  avatar: string;
  description: string;
  suspendUserDialogOpen: boolean;
  distrustDialogOpen: boolean;
  muted: boolean;
  isDistrusted: boolean;
}

const MAX_BADGE_NR = 9999999;

const ProfileCard = withStyles(styles)(
  class extends React.Component<ProfileCardProps, ProfileCardState> {

    constructor(props: ProfileCardProps) {
      super(props);

      this.state = {
        registered: true,
        following: false,
        followers: 0,
        userFollowings: 0,
        countOfTopics: 0,
        countOfReplies: 0,
        topicStars: 0,
        replyStars: 0,
        avatar: "",
        description: "",
        suspendUserDialogOpen: false,
        distrustDialogOpen: false,
        muted: false,
        isDistrusted: false
      };

      if (
        this.props.user != null &&
        this.props.representatives.includes(this.props.username) &&
        this.props.representatives.includes(this.props.user.name)
      ) {
        isRepresentativeDistrustedByMe(this.props.user, this.props.username).then(distrusted =>
          this.setState({ isDistrusted: distrusted })
        );
      }

      this.toggleFollowing = this.toggleFollowing.bind(this);
      this.renderIcons = this.renderIcons.bind(this);
      this.renderActions = this.renderActions.bind(this);
      this.suspendUser = this.suspendUser.bind(this);
      this.handleSuspendUserClose = this.handleSuspendUserClose.bind(this);
      this.distrustRepresentative = this.distrustRepresentative.bind(this);
      this.handleDistrustDialogClose = this.handleDistrustDialogClose.bind(this);
    }

    componentDidMount(): void {
      isRegistered(this.props.username).then(isRegistered => {
        this.setState({ registered: isRegistered });

        if (isRegistered) {
          const user: ChromunityUser = this.props.user;
          if (user != null && user.name != null) {
            amIAFollowerOf(this.props.user, this.props.username).then(isAFollower =>
              this.setState({ following: isAFollower })
            );
            getMutedUsers(user).then(users =>
              this.setState({
                muted: users.includes(this.props.username.toLocaleLowerCase())
              })
            );
          }

          getUserSettingsCached(this.props.username, 1440).then(settings =>
            this.setState({
              avatar: ifEmptyAvatarThenPlaceholder(settings.avatar, this.props.username),
              description: settings.description
            })
          );
          countUserFollowers(this.props.username).then(count => this.setState({ followers: count }));
          countUserFollowings(this.props.username).then(count => this.setState({ userFollowings: count }));
          countTopicsByUser(this.props.username).then(count => this.setState({ countOfTopics: count }));
          countRepliesByUser(this.props.username).then(count => this.setState({ countOfReplies: count }));
          countTopicStarRatingForUser(this.props.username).then(count => this.setState({ topicStars: count }));
          countReplyStarRatingForUser(this.props.username).then(count => this.setState({ replyStars: count }));
        }
      });
    }

    render() {
      if (this.state.registered) {
        return (
          <div>
            <ChromiaPageHeader text={"@" + this.props.username} />
            <Card key={"user-card"}>
              {this.renderActions()}
              <div className={this.props.classes.contentWrapper}>
                <Avatar src={this.state.avatar} size={AVATAR_SIZE.LARGE} name={this.props.username} />
              </div>
              <Typography variant="subtitle1" component="p" className={this.props.classes.description}>
                {this.state.description !== "" ? this.state.description : "I haven't written any description yet..."}
              </Typography>
              <div style={{ clear: "left" }} />
              {this.renderIcons()}
            </Card>
          </div>
        );
      } else {
        return <NotFound />;
      }
    }

    toggleFollowing() {
      this.props.clearTopicsCache();
      if (this.state.following) {
        removeFollowing(this.props.user, this.props.username).then(() => {
          this.setState(prevState => ({
            following: false,
            followers: prevState.followers - 1,
            userFollowings: prevState.userFollowings
          }));
        });
      } else {
        createFollowing(this.props.user, this.props.username).then(() => {
          this.setState(prevState => ({
            following: true,
            followers: prevState.followers + 1,
            userFollowings: prevState.userFollowings
          }));
        });
      }
    }

    renderRepresentativeActions() {
      if (this.props.user != null && this.props.representatives.includes(toLowerCase(this.props.user.name))) {
        if (this.props.representatives.includes(toLowerCase(this.props.username))) {
          return this.renderDistrustButton();
        } else {
          return this.renderSuspensionButton();
        }
      }
    }

    renderDistrustButton() {
      return (
        <div style={{ display: "inline" }}>
          <IconButton onClick={() => this.setState({ distrustDialogOpen: true })}>
            <Tooltip title="Distrust the representative">
              <SentimentVeryDissatisfiedSharp fontSize="large" className={this.props.classes.iconRed} />
            </Tooltip>
          </IconButton>
        </div>
      );
    }

    renderSuspensionButton() {
      if (!hasReportId(SUSPEND_USER_OP_ID + ":" + toLowerCase(this.props.username))) {
        return (
          <div style={{ display: "inline" }}>
            <IconButton onClick={() => this.setState({ suspendUserDialogOpen: true })}>
              <Tooltip title="Suspend user">
                <VoiceOverOff fontSize="large" className={this.props.classes.iconRed} />
              </Tooltip>
            </IconButton>
          </div>
        );
      }
    }

    suspendUser() {
      this.setState({ suspendUserDialogOpen: false });
      suspendUser(this.props.user, this.props.username);
    }

    distrustRepresentative() {
      this.setState({ distrustDialogOpen: false, isDistrusted: true });
      distrustAnotherRepresentative(this.props.user, this.props.username).then();
    }

    handleSuspendUserClose() {
      if (this.state.suspendUserDialogOpen) {
        this.setState({ suspendUserDialogOpen: false });
      }
    }

    handleDistrustDialogClose() {
      if (this.state.distrustDialogOpen) {
        this.setState({ distrustDialogOpen: false });
      }
    }

    toggleMuteUser() {
      const muted: boolean = !this.state.muted;
      this.setState({ muted: muted }, () => toggleUserMute(this.props.user, this.props.username, muted));
    }

    renderIcons() {
      const user: ChromunityUser = this.props.user;
      return (
        <div className={this.props.classes.bottomBar}>
          {user != null && this.props.username === user.name && (
            <Badge badgeContent={this.state.followers} showZero={true} color="secondary" max={MAX_BADGE_NR}>
              <Tooltip title="Followers">
                <Favorite />
              </Tooltip>
            </Badge>
          )}
          <Badge badgeContent={this.state.userFollowings} showZero={true} color="secondary" max={MAX_BADGE_NR}>
            <Tooltip title="Following users">
              <SupervisedUserCircle style={{ marginLeft: "10px" }} />
            </Tooltip>
          </Badge>
          <Badge
            badgeContent={this.state.topicStars + this.state.replyStars}
            showZero={true}
            color="secondary"
            max={MAX_BADGE_NR}
          >
            <Tooltip title="Stars">
              <StarRate style={{ marginLeft: "10px" }} />
            </Tooltip>
          </Badge>
          <Badge badgeContent={this.state.countOfTopics} showZero={true} color="secondary" max={MAX_BADGE_NR}>
            <Tooltip title="Topics">
              <Inbox style={{ marginLeft: "10px" }} />
            </Tooltip>
          </Badge>
          <Badge
            badgeContent={this.state.countOfReplies}
            showZero={true}
            max={MAX_BADGE_NR}
            color="secondary"
            style={{ marginRight: "15px" }}
          >
            <Tooltip title="Replies">
              <ReplyAll style={{ marginLeft: "10px" }} />
            </Tooltip>
          </Badge>
        </div>
      );
    }

    renderActions() {
      const user: ChromunityUser = this.props.user;
      if (user != null && this.props.username !== user.name) {
        return (
          <div style={{ float: "right" }}>
            {this.renderUserSuspensionDialog()}
            {this.renderDistrustDialog()}
            {this.renderRepresentativeActions()}
            <IconButton onClick={() => this.toggleMuteUser()}>
              {this.state.muted ? (
                <Tooltip title={"Unmute user"}>
                  <VolumeUp fontSize={"large"} className={this.props.classes.iconBlue} />
                </Tooltip>
              ) : (
                <Tooltip title="Mute user">
                  <VolumeOff fontSize={"large"} />
                </Tooltip>
              )}
            </IconButton>
            {this.renderFollowButton()}
          </div>
        );
      }
    }

    renderUserSuspensionDialog() {
      return (
        <Dialog
          open={this.state.suspendUserDialogOpen}
          onClose={this.handleSuspendUserClose}
          aria-labelledby="dialog-title"
        >
          <DialogTitle id="dialog-title">Are you sure?</DialogTitle>
          <DialogContent>
            <DialogContentText>
              This action will suspend the user, temporarily preventing them from posting anything.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={this.handleSuspendUserClose} color="secondary">
              No
            </Button>
            <Button onClick={this.suspendUser} color="primary">
              Yes
            </Button>
          </DialogActions>
        </Dialog>
      );
    }

    renderDistrustDialog() {
      return (
        <Dialog
          open={this.state.distrustDialogOpen}
          onClose={this.handleDistrustDialogClose}
          aria-labelledby="dialog-title"
        >
          <DialogTitle id="dialog-title">Are you sure?</DialogTitle>
          <DialogContent>
            <DialogContentText>
              This action will distrust the representative, if enough of representatives distrusts another
              representatives, the user will have their representative status removed.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={this.handleDistrustDialogClose} color="secondary">
              No
            </Button>
            <Button onClick={this.distrustRepresentative} color="primary">
              Yes
            </Button>
          </DialogActions>
        </Dialog>
      );
    }

    renderFollowButton() {
      const user: ChromunityUser = this.props.user;
      if (user != null && user.name === this.props.username) {
        return (
          <Badge badgeContent={this.state.followers} showZero={true} color="secondary" max={MAX_BADGE_NR}>
            <Tooltip title="Followers">
              <Favorite fontSize="large" />
            </Tooltip>
          </Badge>
        );
      } else {
        return (
          <IconButton onClick={() => this.toggleFollowing()}>
            <Badge badgeContent={this.state.followers} showZero={true} color="secondary" max={MAX_BADGE_NR}>
              <Tooltip title={this.state.following ? "Unfollow" : "Follow"}>
                <Favorite fontSize="large" className={this.state.following ? this.props.classes.iconRed : ""} />
              </Tooltip>
            </Badge>
          </IconButton>
        );
      }
    }
  }
);

const mapStateToProps = (store: ApplicationState) => {
  return {
    user: store.account.user,
    representatives: store.government.representatives.map(rep => toLowerCase(rep))
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    clearTopicsCache: () => dispatch(clearTopicsCache())
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(ProfileCard);
