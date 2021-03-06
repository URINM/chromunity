import React from 'react';
import { connect } from 'react-redux';
import { Snackbar } from '@material-ui/core';
import ApplicationState from '../application-state';
import { clearError, clearSuccess, clearInfo } from './redux/snackbar-actions';
import { CustomSnackbarContentWrapper } from '../../shared/custom-snackbar';

interface Props {
  error: boolean;
  errorMsg: string;
  info: boolean;
  infoMsg: string;
  success: boolean;
  successMsg: string;
  clearError: typeof clearError;
  clearInfo: typeof clearInfo;
  clearSuccess: typeof clearSuccess;
}

const SnackbarHolder: React.FunctionComponent<Props> = (props) => {
  return (
    <>
      <Snackbar
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        style={{
          zIndex: 10000,
        }}
        open={props.success}
        autoHideDuration={3000}
        onClose={props.clearSuccess}
      >
        <CustomSnackbarContentWrapper variant="success" message={props.successMsg} />
      </Snackbar>
      <Snackbar
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        style={{
          zIndex: 10000,
        }}
        open={props.error}
        autoHideDuration={3000}
        onClose={props.clearError}
      >
        <CustomSnackbarContentWrapper variant="error" message={props.errorMsg} />
      </Snackbar>
      <Snackbar
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        style={{
          zIndex: 10000,
        }}
        open={props.info}
        autoHideDuration={3000}
        onClose={props.clearInfo}
      >
        <CustomSnackbarContentWrapper variant="info" message={props.infoMsg} />
      </Snackbar>
    </>
  );
};

const mapStateToProps = (store: ApplicationState) => {
  return {
    error: store.snackbar.error,
    errorMsg: store.snackbar.errorMsg,
    info: store.snackbar.info,
    infoMsg: store.snackbar.infoMsg,
    success: store.snackbar.success,
    successMsg: store.snackbar.successMsg,
  };
};

const mapDispatchToProps = {
  clearError,
  clearSuccess,
  clearInfo,
};

export default connect(mapStateToProps, mapDispatchToProps)(SnackbarHolder);
