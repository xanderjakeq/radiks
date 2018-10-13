import { loadUserData } from 'blockstack/lib/auth/authApp';
import { getPublicKeyFromPrivate } from 'blockstack/lib/keys';

import Model from '../model';
import SigningKey from './signing-key';

const decrypted = true;

export default class BlockstackUser extends Model {
  static schema = {
    username: {
      type: String,
      decrypted,
    },
    publicKey: {
      type: String,
      decrypted,
    },
    profile: {
      type: String,
      decrypted,
    },
    signingKeyId: String,
  }

  static currentUser() {
    if (typeof window === 'undefined') {
      return null;
    }

    const userData = loadUserData();
    if (!userData) {
      return null;
    }

    const { username, profile, appPrivateKey } = userData;
    const publicKey = getPublicKeyFromPrivate(appPrivateKey);
    const Clazz = this;
    const user = new Clazz({
      id: username,
      username,
      publicKey,
      profile,
    });

    return user;
  }

  static createWithCurrentUser() {
    return new Promise((resolve, reject) => {
      const resolveUser = (user, _resolve) => user.save().then(() => {
        _resolve(user);
      });
      try {
        const user = this.currentUser();
        user.fetch().finally(() => {
          if (!user.attrs.signingKeyId) {
            SigningKey.create().then((key) => {
              user.attrs.signingKeyId = key.id;
              resolveUser(user, resolve);
            });
          } else {
            resolveUser(user, resolve);
          }
          user.save().then(() => {
            resolve(user);
          });
        });
      } catch (error) {
        reject(error);
      }
    });
  }
}
