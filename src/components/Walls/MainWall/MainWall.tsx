import React from 'react';
import '../Wall.css';
import { Container, Button, createMuiTheme } from "@material-ui/core";
import { getThreadsPriorTo, getThreadsFromFollowsPriorToTimestamp } from "../../../blockchain/MessageService";
import { Thread } from "../../../types";

import { ThreadCard } from "../../ThreadCard/ThreadCard";
import { NewThreadButton } from "../../buttons/NewThreadButton";
import Switch from "@material-ui/core/Switch";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import FormGroup from "@material-ui/core/FormGroup";
import { getUser } from "../../../util/user-util";
import { } from '@material-ui/core/colors';
import { MuiThemeProvider } from '@material-ui/core/styles';

export interface MainWallState {
    threads: Thread[];
    id: string;
    truncated: boolean;
    displayFollowersOnlySwitch: boolean;
    followersOnly: boolean;
    //existsOlder: boolean;
}

function shouldDisplayFollowersOnlySwitch(): boolean {
    return getUser().name != null;
}

const chromiaTheme = createMuiTheme({ palette: { primary: { main: "#FFAFC1" } } })
const threadsPageLimit: number = 25;

export class MainWall extends React.Component<{}, MainWallState> {

    constructor(props: any) {
        super(props);
        this.state = {
            threads: [],
            id: "",
            truncated: true,
            displayFollowersOnlySwitch: shouldDisplayFollowersOnlySwitch(),
            followersOnly: false
        };

        this.retrieveNewThreads = this.retrieveNewThreads.bind(this);
        this.retrieveOlderThreads = this.retrieveOlderThreads.bind(this);
    }

    componentDidMount(): void {
        this.retrieveNewThreads();
    }

    retrieveNewThreads() {
        var threads: Promise<Thread[]>;
        if (this.state.followersOnly) {
            threads = getThreadsFromFollowsPriorToTimestamp(getUser(), Date.now());
        } else {
            threads = getThreadsPriorTo(Date.now());
        }

        threads.then(retrievedThreads => {
            if (retrievedThreads.length > 0) {
                this.setState(prevState => ({
                    threads: retrievedThreads.concat(prevState.threads)
                }));
            }
        });
    }

    retrieveOlderThreads() {
        if (this.state.threads.length > 0) {
            const oldestTimestamp: number = this.state.threads[this.state.threads.length - 1].timestamp;

            var threads: Promise<Thread[]>;
            if (this.state.followersOnly) {
                threads = getThreadsFromFollowsPriorToTimestamp(getUser(), oldestTimestamp);
            } else {
                threads = getThreadsPriorTo(oldestTimestamp);
            }

            threads.then(retrievedThreads => {
                if (retrievedThreads.length > 0) {
                    this.setState(prevState => ({
                        threads: prevState.threads.concat(retrievedThreads)
                    }));
                }
            });
        }
    }

    renderFollowersOnlySwitch() {
        if (this.state.displayFollowersOnlySwitch) {
            return (
                <FormGroup row>
                    <FormControlLabel className="switch-label"
                        control={
                            <Switch checked={this.state.followersOnly}
                                onChange={() => this.toggleFollowersOnly()}
                                value={this.state.followersOnly}
                                className="switch" />
                        }
                        label="Followers only"
                    />
                </FormGroup>
            )
        }
    }

    toggleFollowersOnly() {
        this.setState(prevState => ({
            followersOnly: !prevState.followersOnly, threads: []
        }), () => this.retrieveNewThreads());
    }

    renderLoadMoreButton() {
        if (this.state.threads.length >= threadsPageLimit &&
            this.state.threads.length % threadsPageLimit === 0) {
            return (
                <MuiThemeProvider theme={chromiaTheme}>
                    <Button type="submit" fullWidth color="primary"
                        onClick={() => this.retrieveOlderThreads()}
                    >
                        Load more
                    </Button>
                </MuiThemeProvider>
            )
        }
    }

    render() {
        return (
            <div>
                <Container fixed maxWidth="md">
                    <div className="thread-wall-container">
                        <br />
                        {this.renderFollowersOnlySwitch()}
                        {this.state.threads.map(thread => <ThreadCard
                            key={"card-" + thread.id}
                            truncated={true}
                            isSubCard={false}
                            isUserPage={false}
                            thread={thread}
                        />)}
                    </div>
                    {this.renderLoadMoreButton()}
                </Container>
                <NewThreadButton updateFunction={this.retrieveNewThreads} />
            </div>
        );
    }

}
