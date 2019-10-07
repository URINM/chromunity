import React, { useEffect, useState } from "react";
import { Chat } from "../../types";
import { createStyles, ListItem, makeStyles, Theme } from "@material-ui/core";
import ListItemText from "@material-ui/core/ListItemText";
import { timeAgoReadable } from "../../util/util";
import { getUserSettingsCached } from "../../blockchain/UserService";
import { ifEmptyAvatarThenPlaceholder } from "../../util/user-util";
import Avatar, { AVATAR_SIZE } from "../common/Avatar";
import ListItemIcon from "@material-ui/core/ListItemIcon";

interface Props {
  chat: Chat;
  selectedId?: string;
  onClick: Function;
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    selected: {
      borderBottom: "2px outset",
      borderBottomColor: theme.palette.primary.main
    }
  })
);

const ChatListItem: React.FunctionComponent<Props> = (props: Props) => {
  const classes = useStyles(props);
  const [avatar, setAvatar] = useState("");

  useEffect(() => {
    if (props.chat.last_message != null) {
      getUserSettingsCached(props.chat.last_message.sender, 600).then(settings =>
        setAvatar(ifEmptyAvatarThenPlaceholder(settings.avatar, props.chat.last_message.sender))
      );
    }
  }, [props]);

  return (
    <ListItem
      button
      className={props.chat.id === props.selectedId ? classes.selected : ""}
      onClick={() => props.onClick(props.chat)}
    >
      {avatar.length !== 0 && (
        <ListItemIcon style={{ float: "left" }}>
          <Avatar src={avatar} size={AVATAR_SIZE.SMALL} />
        </ListItemIcon>
      )}
      <ListItemText
        primary={props.chat.title}
        secondary={timeAgoReadable(
          props.chat.last_message != null ? props.chat.last_message.timestamp : props.chat.timestamp
        )}
      />
    </ListItem>
  );
};

export default ChatListItem;
