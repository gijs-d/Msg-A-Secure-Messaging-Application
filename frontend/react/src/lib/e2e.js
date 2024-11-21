import * as forge from 'node-forge';
import { ec } from 'elliptic';
const ecdh = new ec('curve25519');

class E2e {
    keys = [];
    loaded = false;
    deriveKeys(fkeys) {
        try {
            const dkey1 = this.keys[0].derive(ecdh.keyFromPublic(fkeys[0], 'hex').getPublic());
            const dkey2 = this.keys[1].derive(ecdh.keyFromPublic(fkeys[1], 'hex').getPublic());
            return [dkey1, dkey2];
        } catch {
            return [];
        }
    }

    encryptMessage(msg, dkeys, binary = false) {
        try {
            const key = forge.util.hexToBytes(dkeys[0].toString(16).substring(0, 64));
            const iv = forge.util.hexToBytes(dkeys[1].toString(16).substring(0, 64));
            const encrypted = this.encryptAES(key, iv, msg, binary);
            return {
                msg: encrypted,
                encrypted: true,
            };
        } catch {
            /* empty */
        }
        return {
            msg: msg,
            encrypted: false,
        };
    }

    decryptMessage(msg, dkeys, binary = false) {
        try {
            const key = forge.util.hexToBytes(dkeys[0].toString(16).substring(0, 64));
            const iv = forge.util.hexToBytes(dkeys[1].toString(16).substring(0, 64));
            const decrypted = this.decryptAES(key, iv, msg, binary);
            if (decrypted) {
                return { msg: decrypted, encrypted: true };
            }
        } catch {
            /* empty */
        }
        return { msg, encrypted: false };
    }

    sha512(value) {
        const md = forge.md.sha512.create();
        md.update(value);
        return md.digest().toHex();
    }

    checkKeys() {
        return this.keys.length == 2;
    }

    loadKeys(id) {
        this.loaded = true;
        if (!id) {
            return false;
        }
        const storageKey = this.sha512(id);
        let keys = localStorage.getItem(storageKey);
        if (!keys) {
            return false;
        }
        const key = atob(storageKey).substring(0, 16);
        const iv = atob(storageKey).substring(16, 32);
        keys = this.decryptAES(key, iv, keys);
        if (!keys) {
            return false;
        }
        keys = JSON.parse(keys);
        const key1 = ecdh.keyPair({
            priv: keys.priv1,
            privEnc: keys.enc,
            pub: keys.pub1,
            pubEnc: keys.enc,
        });
        const key2 = ecdh.keyPair({
            priv: keys.priv2,
            privEnc: keys.enc,
            pub: keys.pub2,
            pubEnc: keys.enc,
        });
        this.keys = [key1, key2];
        return true;
    }

    hasKeys(id) {
        if (!id) {
            return false;
        }
        if (!this.loaded) {
            this.loadKeys(id);
        }
        return this.keys.length == 2;
    }

    getKeys() {
        if (this.keys.length !== 2) {
            return false;
        }
        return {
            priv1: this.keys[0].getPrivate('hex'),
            priv2: this.keys[1].getPrivate('hex'),
            pub1: this.keys[0].getPublic('hex'),
            pub2: this.keys[1].getPublic('hex'),
        };
    }

    setKeys(keys, id) {
        const key1 = ecdh.keyPair({
            priv: keys.priv1,
            privEnc: 'hex',
            pub: keys.pub1,
            pubEnc: 'hex',
        });
        const key2 = ecdh.keyPair({
            priv: keys.priv2,
            privEnc: 'hex',
            pub: keys.pub2,
            pubEnc: 'hex',
        });
        this.keys = [key1, key2];
        this.saveKeys(id);
    }

    saveKeys(id) {
        if (this.keys.length !== 2) {
            return false;
        }
        const storageKey = this.sha512(id);
        const key = atob(storageKey).substring(0, 16);
        const iv = atob(storageKey).substring(16, 32);
        const keys = this.getKeys();
        keys['enc'] = 'hex';
        const encryptedKeys = this.encryptAES(key, iv, JSON.stringify(keys));
        if (!encryptedKeys) {
            return false;
        }
        localStorage.setItem(storageKey, encryptedKeys);
        return true;
    }

    encryptAES(key, iv, msg, binary = false) {
        const cipher = forge.cipher.createCipher('AES-CBC', key);
        cipher.start({ iv });
        if (binary) {
            cipher.update(forge.util.createBuffer(msg, 'binary'));
        } else {
            cipher.update(forge.util.createBuffer(msg)); //atob(msg), 'binary'));
        }
        cipher.finish();
        if (binary) {
            return cipher.output.data;
        }
        return btoa(cipher.output.data);
    }

    decryptAES(key, iv, msg, binary = false) {
        try {
            const decipher = forge.cipher.createDecipher('AES-CBC', key);
            decipher.start({ iv: iv });
            if (binary) {
                decipher.update(forge.util.createBuffer(msg, 'binary'));
            } else {
                decipher.update(forge.util.createBuffer(atob(msg), 'binary'));
            }
            const result = decipher.finish();
            if (result && decipher.output.data) {
                return decipher.output.data;
            }
        } catch {
            /* empty */
        }
        return false;
    }

    genKeys() {
        const key1 = ecdh.genKeyPair();
        const key2 = ecdh.genKeyPair();
        this.keys = [key1, key2];
        return [key1.getPublic('hex'), key2.getPublic('hex')];
    }
}

export default new E2e();
