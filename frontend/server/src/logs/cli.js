class Cli {
    prefix = [];
    times = {};

    constructor(map, bestand) {
        for (let i = 0; i < arguments.length; i++) {
            this.prefix.push(arguments[i]);
        }
        this.map = map;
        this.bestand = bestand;
    }

    print(tekst, lvl) {
        const pref = this.prefix.map(p => `[${p}]`).join('');
        return `[${new Date().toISOString().split('.')[0]}]${[pref]}[${lvl}] : ${tekst} ;`;
    }

    log(tekst) {
        console.log('\x1b[37m', this.print(tekst, 'log'));
    }

    debug(tekst) {
        console.log('\x1b[37m', this.print(tekst, 'log'));
    }

    info(tekst) {
        console.log('\x1b[36m', this.print(tekst, 'info'));
    }

    infoTime(tekst) {
        if (this.times[tekst]) {
            const start = this.times[tekst];
            const stop = new Date().getTime();
            const time = (stop - start) / 1000;
            let tstr = '';
            if (time >= 3600) {
                tstr += ` ${Math.floor(time / 3600)}h `;
            }
            if (time >= 60) {
                tstr += ` ${Math.floor((time % 3600) / 60)}m `;
            }
            tstr += ` ${(time % 60).toFixed(2)}s `;
            this.times[tekst] = undefined;
            tekst += tstr;
        } else {
            this.times[tekst] = new Date().getTime();
        }
        console.log('\x1b[36m', this.print(tekst, 'info'));
    }

    succes(tekst) {
        console.log('\x1b[32m', this.print(tekst, 'succes'));
    }

    tempLog(tekst) {
        process.stdout.write(`\x1b[37m ${this.print(tekst, 'tempLog')}  \r`);
    }

    warn(tekst) {
        console.log('\x1b[33m', this.print(tekst, 'warn'));
    }

    error(tekst) {
        console.log('\x1b[31m', this.print(tekst, 'error'));
    }
}

module.exports = Cli;
