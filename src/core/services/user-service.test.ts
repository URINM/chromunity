import { UserSettings, ChromunityUser } from '../../types';
import {
  getDistrustedUsers,
  getUserSettings,
  getUserSettingsCached,
  toggleUserDistrust,
  updateUserSettings,
} from './user-service';

import { createLoggedInUser } from '../../shared/test-utility/users';

jest.setTimeout(30000);

describe('User tests', () => {
  let loggedInUser: ChromunityUser;
  let secondUser: ChromunityUser;

  it('account users', async () => {
    loggedInUser = await createLoggedInUser();
    expect(loggedInUser).toBeDefined();

    secondUser = await createLoggedInUser();
    expect(secondUser).toBeDefined();
  });

  it('user settings test', async () => {
    let userSettings: UserSettings = await getUserSettings(loggedInUser);
    expect(userSettings).toBeDefined();

    userSettings = await getUserSettings(loggedInUser);
    expect(userSettings.avatar).toBe('');
    expect(userSettings.description).toBe('');
    expect(userSettings.socials).toBe('{}');

    await updateUserSettings(
      loggedInUser,
      'BB==',
      'Description',
      {
        twitter: '',
        linkedin: '',
        facebook: '',
        github: '',
      },
      ''
    );
    userSettings = await getUserSettings(loggedInUser);
    expect(userSettings.avatar).toBe('BB==');
    expect(userSettings.description).toBe('Description');
    expect(userSettings.socials).toContain('twitter');

    const settings: UserSettings = await getUserSettingsCached(loggedInUser.name, 0);
    expect(settings.avatar).toBe('BB==');
    expect(settings.description).toBe('Description');
  });

  it('mute and unmute user', async () => {
    let mutedUsers: string[] = await getDistrustedUsers(loggedInUser);
    expect(mutedUsers.length).toBe(0);

    await toggleUserDistrust(loggedInUser, secondUser.name, true);
    mutedUsers = await getDistrustedUsers(loggedInUser);
    expect(mutedUsers.length).toBe(1);

    await toggleUserDistrust(loggedInUser, secondUser.name, false);
    mutedUsers = await getDistrustedUsers(loggedInUser);
    expect(mutedUsers.length).toBe(0);
  });
});
