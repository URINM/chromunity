import React from 'react';
import { Badge, makeStyles, IconButton, Tooltip } from '@material-ui/core';
import { StarRate, StarBorder } from '@material-ui/icons';
import { COLOR_YELLOW } from '../../theme';

interface Props {
  ratedBy: string[];
  ratedByMe: boolean;
  toggleRating?: () => void;
  className?: string;
  disabled: boolean;
}

const useStyles = makeStyles({
  icon: {
    color: COLOR_YELLOW,
  },
});

const StarRatingPresentation: React.FunctionComponent<Props> = (props) => {
  const classes = useStyles();

  function render() {
    if (props.toggleRating) {
      return (
        <IconButton data-tut="star_btn" aria-label="Like" onClick={props.toggleRating} disabled={props.disabled}>
          {icon()}
        </IconButton>
      );
    }
    return icon();
  }

  function icon() {
    return (
      <Badge color="secondary" badgeContent={props.ratedBy.length}>
        {props.ratedByMe ? <StarRate className={classes.icon} /> : <StarBorder />}
      </Badge>
    );
  }

  function likedBy() {
    const maxRenderItems = 5;
    return (
      <div>
        {props.ratedBy.length > 0 ? <div /> : <p>Like</p>}
        {props.ratedBy.slice(0, maxRenderItems).map((u) => (
          <p key={u}>@{u}</p>
        ))}
        {props.ratedBy.length > maxRenderItems ? (
          <p key="more">
            <i>
              ...and <b>{props.ratedBy.length - maxRenderItems}</b> more
            </i>
          </p>
        ) : (
          <div />
        )}
      </div>
    );
  }

  return (
    <div className={props.className}>
      <Tooltip title={likedBy()}>{render()}</Tooltip>
    </div>
  );
};

export default StarRatingPresentation;
