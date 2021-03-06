import React, { useEffect, useState } from 'react';
import { Redirect, RouteComponentProps } from 'react-router';
import { parse } from 'query-string';
import { connect } from 'react-redux';
import { createStyles, CircularProgress } from '@material-ui/core';
import Container from '@material-ui/core/Container';
import { makeStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import { registerUser, resetLoginState, vaultCancel, vaultSuccess } from '../redux/account-actions';
import ApplicationState from '../../../core/application-state';
import { ChromunityUser } from '../../../types';
import ChromiaPageHeader from '../../../shared/chromia-page-header';
import { AuthenticationStep } from '../redux/account-types';
import { ReactComponent as LeftShapes } from '../../../shared/graphics/left-shapes.svg';
import { ReactComponent as RightShapes } from '../../../shared/graphics/right-shapes.svg';
import { notifyError } from '../../../core/snackbar/redux/snackbar-actions';

interface Props extends RouteComponentProps {
  vaultSuccess: typeof vaultSuccess;
  vaultCancel: typeof vaultCancel;
  resetLoginState: typeof resetLoginState;
  registerUser: typeof registerUser;
  notifyError: typeof notifyError;
  authenticationStep: AuthenticationStep;
  user: ChromunityUser;
  error: string;
}

const useStyles = makeStyles((theme) =>
  createStyles({
    contentWrapper: {
      textAlign: 'center',
    },
    textInput: {
      marginTop: '10px',
      marginBottom: '20px',
      width: '250px',
    },
    btnInput: {
      marginTop: '10px',
      marginBottom: '20px',
      width: '100px',
    },
    leftShapes: {
      [theme.breakpoints.down('sm')]: {
        display: 'none',
      },
      float: 'left',
    },
    rightShapes: {
      [theme.breakpoints.down('sm')]: {
        display: 'none',
      },
      float: 'right',
    },
  })
);

const VaultSuccess: React.FunctionComponent<Props> = (props) => {
  const classes = useStyles();

  const [name, setName] = useState('');

  useEffect(() => {
    const query = parse(props.location.search);
    const rawTx: string = query.rawTx as string;
    if (rawTx) {
      props.vaultSuccess(rawTx);
    } else {
      props.notifyError('Bad data received from vault');
      props.vaultCancel();
    }
    // eslint-disable-next-line
  }, []);

  const selectUsername = () => {
    if (/\s/.test(name)) {
      props.notifyError('Username may not contain whitespace');
      setName('');
    } else if (!/[a-zA-Z0-9]{3,16}/.test(name)) {
      props.notifyError(
        'Username must start with a a-z, A-Z or 0-9 character. Username should have a size between 3-16 characters.'
      );
      setName('');
    } else {
      props.registerUser(name);
    }
  };

  const body = () => {
    return (
      <Container maxWidth="md" className={classes.contentWrapper}>
        {authentication()}
      </Container>
    );
  };

  const authentication = () => {
    if (props.error != null) {
      return <Redirect to="/user/login" />;
    }
    if (
      props.authenticationStep == null ||
      props.authenticationStep === AuthenticationStep.CONFIRMING_VAULT_TRANSACTION ||
      props.authenticationStep === AuthenticationStep.VAULT_IN_PROGRESS
    ) {
      return waitingForConfirmation('Almost there!', 'Give us a second to authenticate you...');
    }
    if (props.authenticationStep === AuthenticationStep.USERNAME_INPUT_REQUIRED) {
      return registerNewUser();
    }
    if (props.authenticationStep === AuthenticationStep.REGISTERING_USER) {
      return waitingForConfirmation('Registering...', 'Just a sec while we set up your account!');
    }
    if (props.authenticationStep === AuthenticationStep.AUTHENTICATED) {
      return <Redirect to="/" />;
    }
    return <Redirect to="/user/login" />;
  };

  const waitingForConfirmation = (title: string, message: string) => {
    return (
      <>
        <CircularProgress />
        <ChromiaPageHeader text={title} />
        <LeftShapes className={classes.leftShapes} />
        <RightShapes className={classes.rightShapes} />
        <p>{message}</p>
      </>
    );
  };

  const registerNewUser = () => {
    return (
      <Container maxWidth="md" className={classes.contentWrapper}>
        <ChromiaPageHeader text={"It looks like you're new here!"} />
        <LeftShapes className={classes.leftShapes} />
        <RightShapes className={classes.rightShapes} />
        <p>By which name would you like to be referred to?</p>
        <TextField
          label="Username"
          name="name"
          type="text"
          variant="outlined"
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => setName(event.target.value)}
          className={classes.textInput}
        />
        <br />
        <Button color="primary" variant="contained" className={classes.btnInput} onClick={selectUsername}>
          Continue
        </Button>
      </Container>
    );
  };

  return body();
};

const mapStateToProps = (store: ApplicationState) => {
  return {
    user: store.account.user,
    authenticationStep: store.account.authenticationStep,
  };
};

const mapDispatchToProps = {
  vaultSuccess,
  vaultCancel,
  registerUser,
  notifyError,
};

export default connect(mapStateToProps, mapDispatchToProps)(VaultSuccess);
