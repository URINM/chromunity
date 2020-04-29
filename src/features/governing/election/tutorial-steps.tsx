import React from "react";
import { COLOR_CHROMIA_DARK } from "../../../theme";

export const electionTutorialSteps = (candidates: number) => {
  const steps = [
    {
      selector: ".first-step",
      content: () => (
        <div style={{ color: COLOR_CHROMIA_DARK }}>
          <p>
            As a decentralized community, Chromunity is self-governing by public elections where representatives are
            chosen who act as moderators.
          </p>
          <p>
            Elections and governing periods have a fixed block duration. Representatives remain until the next election
            has wrapped up.
          </p>
        </div>
      ),
    },
    {
      selector: ".second-step",
      content: () => (
        <div style={{ color: COLOR_CHROMIA_DARK }}>
          <p>As an active member of Chromunity you are able to both participate and vote in elections.</p>
          <p>In order to participate in an election you must have signed up before the election started.</p>
        </div>
      ),
    },
    {
      selector: '[data-tut="election_status"]',
      content: () => (
        <div style={{ color: COLOR_CHROMIA_DARK }}>
          <p>The status of the election is displayed here.</p>
          <p>You will get information of how many blocks are left until the election will wrap up.</p>
        </div>
      ),
    },
  ];

  if (candidates > 0) {
    steps.push({
      selector: '[data-tut="candidates"]',
      content: () => (
        <div style={{ color: COLOR_CHROMIA_DARK }}>
          <p>Candidates that you may vote for are listed here.</p>
          <p>
            You can only have one active vote per election, however, you may always change your vote until the election
            wraps up.
          </p>
          <p>It is not possible to vote for yourself.</p>
        </div>
      ),
    });
  }

  return steps;
};
