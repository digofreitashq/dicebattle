function contains(text, value) {
    return text.indexOf(value) != -1;
}

class Dice {
    constructor(){
        this.total = 0;
        this.critical = 0;
        this.failure = 0;
        this.rolls = [];
    }
    random(limit) {
        return Math.floor(Math.random() * limit);
    }
    roll(dices) {
        if (!contains(dices, 'd')) return 0;
        var parts = dices.split('d');
        if (parts.lenght < 2) return 0;
        var times = parseInt(parts[0]);
        var dice = parseInt(parts[1]);
        var rolled = 0;
        for (var i = 0; i < times; i++) {
            rolled = this.random(dice) + 1;
            this.rolls.push(rolled);
            this.total += rolled;
            if (rolled == dice) {
                this.critical++;
                times++;
            } else if (rolled == 1) {
                this.failure++;
                times--;
            }
        }
        return this;
    }
    verbose() {
        var text = '';
        if (this.critical > 0) text += this.critical + ' CRITICAL roll(s)! ';
        if (this.failure > 0) text += this.failure + ' FAILURE roll(s)! ';
        text += 'Dice(s) Result: '+this.rolls.join(' + ')+' = '+this.total;
        return text;
    }
}