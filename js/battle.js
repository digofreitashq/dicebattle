// Sounds
var sounds = {};

// Execution Queue variables
var queue_manager = null;

function get_timestamp() {
    // Returns a date formated string (DD/MM/YY HH:mm:ss)
    var m = new Date();
    return ("0" + m.getUTCDate()).slice(-2) + "/" +
        ("0" + (m.getUTCMonth() + 1)).slice(-2) + "/" +
        ("" + m.getUTCFullYear()).slice(-2) + " " +
        ("0" + m.getUTCHours()).slice(-2) + ":" +
        ("0" + m.getUTCMinutes()).slice(-2) + ":" +
        ("0" + m.getUTCSeconds()).slice(-2);
}

function enqueue_execution(func, params) {
    // Put a function and his parameters to execute in a later call from
    // the Queue Manager
    if (!params) params = [];
    if (!Array.isArray(params)) params = [params];
    queue_manager.put([func, params]);
}

function play_sound(sound_name) {
    // Play a sound
    sounds[sound_name].play();
}

function do_log(text) {
    // Log text
    app.log(text);
}

function do_log_with_sound(text, sound){
    // Log text and play a sound at the same time
    app.log(text);
    play_sound(sound);
}

function log_damage_reaction(damage) {
    // Log commentary about the amount of damage
    if (damage < 5) {
        enqueue_execution(do_log, ['A little push.']);
    } else if (damage < 10) {
        enqueue_execution(do_log, ['Maybe that hurt...']);
    } else if (damage < 20) {
        enqueue_execution(do_log, ['That will leave a nice scar.']);
    } else {
        enqueue_execution(do_log, ['Ouch! Will they recover from that one?']);
    }
}

function check_player_life() {
    // Check player current life and it's states
    
    // Player dies at 0 life
    if (app.player_is_dead) {
        enqueue_execution(do_log, ['Player DIED..']);
        enqueue_execution(do_log, ['YOU LOSE!']);
        enqueue_execution(set_game_result, [false, true]);
        return;
    }

    // Player becomes berserker with 30 life
    if (!app.player_berserker && app.player_life <= 30) {
        enqueue_execution(do_log_with_sound, 
            ['NEVER GIVE UP! Player becomes BERSERK! +5 ATK +10 DEF', 'alert']);
            set_player_attack(app.player_attack + 5);
            set_player_toughness(app.player_toughness + 10);
            set_player_berserker(true);
    
    // Player becomes normal again with more than 30 life
    } else if (app.player_berserker && app.player_life > 30) {
        enqueue_execution(do_log_with_sound, 
            ['STABILIZED... Player is not BERSERK anymore. -5 ATK -10 DEF',
            'alert']);
        set_player_attack(app.player_attack - 5);
        set_player_toughness(app.player_toughness - 10);
        set_player_berserker(false);
    }
}

function check_monster_life() {
    // Check monster current life and it's states

    // Monster dies at 0 life
    if (app.monster_is_dead) {
        enqueue_execution(do_log, ['Monster DIED...']);
        enqueue_execution(do_log, ['YOU WIN!']);
        enqueue_execution(set_game_result, [true, false]);
        return;
    }

    // Monster becomes berserker with 30 life
    if (!app.monster_berserker && app.monster_life <= 40) {
        enqueue_execution(do_log_with_sound, 
            ['DANGER! Monster becomes BERSERK! +10 ATK +10 DEF', 'alert']);
        set_monster_attack(app.monster_attack + 10);
        set_monster_toughness(app.monster_toughness + 10);
        set_monster_berserker(true);
    }
}

function do_player_damage(damage) {
    // Execute Player Damage
    log_damage_reaction(damage);
    enqueue_execution(do_log_with_sound,
        ['** Player takes ' + damage + ' damage!', 'damage']);
    set_player_life(app.player_life - damage);
}

function do_monster_damage(damage) {
    // Execute Monster Damage
    log_damage_reaction(damage);
    enqueue_execution(do_log_with_sound,
        ['** Monster takes ' + damage + ' damage!', 'damage']);
    set_monster_life(app.monster_life - damage);
}

function do_player_restore_life(restore) {
    // Execute Player Life Restore
    set_player_life(app.player_life + restore);
    enqueue_execution(do_log, ['** Player restores ' + restore + ' HP!']);
}

function compute_monster_damage_taken() {
    // Compute Monster Damage Taken
    var player_total_attack = app.player_attack + app.player_rolled.total;
    var monster_total_toughness = app.monster_toughness + app.monster_rolled.total;

    enqueue_execution(
        do_log, ['ATK ' + app.player_attack + ' + ' + app.player_rolled.total + 
        ' = ' + player_total_attack]);
    enqueue_execution(
        do_log, ['DEF ' + app.monster_toughness + ' + ' + app.monster_rolled.total + 
        ' = ' + monster_total_toughness]);

    if (player_total_attack > monster_total_toughness) {
        var damage = player_total_attack - monster_total_toughness;
        do_monster_damage(damage);
    } else {
        enqueue_execution(do_log_with_sound, 
            ['Oops! Player attack FAILED!', 'fail']);
    }
}

function compute_player_damage_taken() {
    // Compute Player Damage Taken
    var player_total_toughness = app.player_toughness + app.player_rolled.total;
    var monster_total_attack = app.monster_attack + app.monster_rolled.total;

    enqueue_execution(
        do_log, ['ATK ' + app.monster_attack + ' + ' + app.monster_rolled.total + 
        ' = ' + monster_total_attack]);
    enqueue_execution
    (do_log, ['DEF ' + app.player_toughness + ' + ' + app.player_rolled.total + 
        ' = ' + player_total_toughness]);

    if (monster_total_attack > player_total_toughness) {
        var damage = monster_total_attack - player_total_toughness;
        do_player_damage(damage);
    } else {
        enqueue_execution(do_log_with_sound, 
            ['Oops! Monster attack FAILED!', 'fail']);
    }

    enqueue_execution(set_game_resolving, false);
}

function check_player_potions() {
    // Check Player Remaining Potions
    if (app.player_potions_are_over) {
        enqueue_execution(do_log, ['No potions left.']);
    } else {
        enqueue_execution(
            do_log, ['Player has ' + app.player_potions + ' potions left.']);
    }
}

function do_monster_attack() {
    // Execute Monster Attacking
    enqueue_execution(app.roll_dice, ['Monster', app.monster_attack_dice]);
    enqueue_execution(app.roll_dice, ['Player', app.player_toughness_dice]);
    enqueue_execution(compute_player_damage_taken);
}

function do_monster_turn() {
    // Execute Monster Turn
    if (app.game_finished || app.monster_is_dead) return;

    enqueue_execution(do_log, ['MONSTER STARTS THEIR TURN.']);

    // Monster Infuriates every 3 turns
    if (app.turn_counter % 3 == 0) {
        enqueue_execution(do_log_with_sound, 
            ['DANGER! Monster infuriates! +2 ATK', 'alert']);
        enqueue_execution(set_monster_attack, app.monster_attack + 2);
    }

    enqueue_execution(do_log_with_sound, 
        ['Monster tries to attack.', 'action']);
    enqueue_execution(do_monster_attack);
    enqueue_execution(check_player_life);
}

function do_player_attack() {
    // Execute Player Attacking
    enqueue_execution(app.roll_dice, ['Player', app.player_attack_dice]);
    enqueue_execution(app.roll_dice, ['Monster', app.monster_toughness_dice]);
    enqueue_execution(compute_monster_damage_taken);
}

function set_player_potions(value){
    // Change Player Potions amount
    if (typeof value == "undefined") value = 0;
    if (value <=0) value = 0;
    app.player_potions = value;
}

function set_player_life(value){
    // Change Player Life amount
    if (typeof value == "undefined") value = 0;
    if (value > app.player_life_total) value = app.player_life_total;
    if (value < 0) value = 0;
    app.player_life = value;
}

function set_player_attack(value){
    // Change Player Attack amount
    if (typeof value == "undefined") value = 0;
    app.player_attack = value;
}

function set_player_toughness(value){
    // Change Player Toughness amount
    if (typeof value == "undefined") value = 0;
    app.player_toughness = value;
}

function set_player_berserker(value){
    // Change Player Berserker status
    app.player_berserker = value;
}

function set_monster_life(value){
    // Change Monster Life amount
    if (typeof value == "undefined") value = 0;
    if (value > app.monster_life_total) value = app.monster_life_total;
    if (value < 0) value = 0;
    app.monster_life = value;
}

function set_monster_attack(value){
    // Change Monster Attack amount
    if (typeof value == "undefined") value = 0;
    app.monster_attack = value;
}

function set_monster_toughness(value){
    // Change Monster Toughness amount
    if (typeof value == "undefined") value = 0;
    app.monster_toughness = value;
}

function set_monster_berserker(value){
    // Change Monster Berserker status
    app.monster_berserker = value;
}

function set_game_result(player_win, monster_win){
    // Set Game Over
    app.player_win = player_win;
    app.monster_win = monster_win;
}

function set_game_resolving(value){
    // Set Game resolving
    app.game_resolving = value;
}

function do_attack() {
    // Action Button Player Attack
    if (app.game_finished || app.game_resolving) return;
    enqueue_execution(set_game_resolving, true);
    sounds['action'].play();
    start_next_turn();
    enqueue_execution(do_log, ['PLAYER STARTS THEIR TURN.']);
    enqueue_execution(do_log, ['Player tries to attack.']);
    enqueue_execution(do_player_attack);
    enqueue_execution(check_monster_life);
    enqueue_execution(do_monster_turn);
}

function use_potion() {
    // Action Button Player Use Potion
    if (app.game_finished || app.game_resolving) return;
    if (app.player_potions_are_over) {
        enqueue_execution(do_log, ['No potions left.']);
        return;
    }
    enqueue_execution(set_game_resolving, true);
    sounds['potion'].play();
    start_next_turn();
    enqueue_execution(do_log, ['PLAYER STARTS THEIR TURN.']);
    enqueue_execution(do_log, ['Player uses potion.']);
    enqueue_execution(set_player_potions, app.player_potions-1)
    enqueue_execution(do_player_restore_life, app.potion_power);
    enqueue_execution(check_player_potions);
    enqueue_execution(check_player_life);
    enqueue_execution(do_monster_turn);
}

function start_next_turn() {
    // Log Turn Start and Add Turn Counter
    app.turn_counter++;
    text = '--------- TURN ' + app.turn_counter + ' STARTED! ---------';
    app.log_list.push(['', text]);
}

function start_game() {
    // Starts Game
    enqueue_execution(do_log, ['Choose an action.']);

    sounds['click'].play();
    enqueue_execution(play_sound, 'theme');
    app.game_waiting = false;
}

function reload() {
    // Reload Game
    window.location.reload();
}

function restart_game() {
    // Execute Restart
    sounds['click'].play();
    enqueue_execution(reload, []);
}

// Components
Vue.component('player-life', {
    props: ['player_life', 'player_life_total'],
    template: `<span class="life-display" ref="refplayer-life">
            <strong>PLAYER:</strong>
            {{ player_life }}/{{ player_life_total }}
        </span>`
});
Vue.component('monster-life', {
    props: ['monster_life', 'monster_life_total'],
    template: `<span class="life-display" ref="refmonster-life">
            <strong>MONSTER:</strong>
            {{ monster_life }}/{{ monster_life_total }}
        </span>`
});
Vue.component('btn-attack', {
    props: ['game_resolving'],
    methods: {
        do_attack: do_attack
    },
    template: `<button 
        id="btn_attack"
        @click="do_attack()"
        :class="{disabled:game_resolving}"
        class="custom-btn btn-square"
        >
            ATTACK
        </button>`
});
Vue.component('btn-potion', {
    props: ['game_resolving', 'player_potions'],
    methods: {
        use_potion: use_potion
    },
    template: `<button 
        id="btn_potion"
        @click="use_potion()"
        :class="{disabled:game_resolving}"
        class="custom-btn btn-square"
        >
            USE POTION
            ({{ player_potions }})
        </button>`
});
Vue.component('btn-start', {
    props: ['game_waiting'],
    methods: {
        start_game: start_game
    },
    template: `<button 
        id="btn_start"
        @click="start_game()"
        class="custom-btn btn-square"
        >
            START GAME
        </button>`
});
Vue.component('btn-restart', {
    props: ['game_finished'],
    methods: {
        restart_game: restart_game
    },
    template: `<button 
        id="btn_restart"
        @click="restart_game()"
        class="custom-btn btn-square"
        >
            RESTART GAME
        </button>`
});
Vue.component('btn-message', {
    props: ['msg'],
    template: `<button class="btn-message" class="custom-btn btn-square">
            {{ msg }}
        </button>`
});
Vue.component('game-sound', {
    props:['sound','loop'],
    template: `<audio :id="'sound_'+sound" :loop="loop">
            <source :src="'./assets/'+sound+'.wav'" type="audio/wav"></source>
        </audio>`
});
Vue.component('history', {
    template: '<div id="history" ref="refhistory"><ul><slot /></ul></div>'
});
Vue.component('log', {
    props: ['log_text'],
    template: `<li>
        <template v-if="log_text[0]">
            {{ log_text[0] }}: <strong>{{ log_text[1] }}</strong>
        </template>
        <template v-else>
            <strong>{{ log_text[1] }}</strong>
        </template>
    </li>`
});
Vue.component('status', {
    props: [
        'game_finished', 'game_waiting', 'game_ready', 'game_resolving',
        'player_win', 'monster_win'
    ],
    template: `<div id="status" ref="refstatus" class="status">
        <span v-if="game_waiting">
            PRESS START
        </span>
        <span v-if="game_ready && !game_resolving">
            CHOOSE AN ACTION
        </span>
        <span v-if="game_resolving">
            PLEASE WAIT...
        </span>
        <span v-if="player_win">
            YOU WIN
        </span>
        <span v-if="monster_win">
            YOU LOSE
        </span>
        </div>`
});

// App Declaration
var app = new Vue({
    el: '#app',
    data: {
        // Game Version
        version: '1.1',

        // Game Control
        game_waiting: true,
        game_resolving: false,
        turn_counter: 0,
        player_win: false,
        monster_win: false,

        // Dices
        player_rolled: 0,
        monster_rolled: 0,

        // Battle Basics
        player_life_total: 50,
        player_life: 0,
        player_attack: 7,
        player_toughness: 9,

        player_potions: 5,
        player_berserker: false,

        monster_life_total: 80,
        monster_life: 0,
        monster_attack: 12,
        monster_toughness: 2,

        monster_berserker: false,

        potion_power: 30,

        log_list: [
            [get_timestamp(), "LET'S BATTLE!"],
            [get_timestamp(), "Click on START GAME to begin."]
        ],

        sound_list: [
            ['theme', true],
            ['damage', false],
            ['fail', false],
            ['potion', false],
            ['alert', false],
            ['click', false],
            ['action', false]
        ]
    },
    computed: {
        game_ready: function () {
            return !this.game_waiting && 
                !(this.player_win || this.monster_win)
        },
        game_finished: function () {
            return this.player_win || this.monster_win;
        },
        player_attack_dice: function () {
            return this.player_berserker ? '2d20' : '1d20'
        },
        player_toughness_dice: function () {
            return this.player_berserker ? '2d20' : '1d20'
        },
        monster_attack_dice: function () {
            return this.monster_berserker ? '2d20' : '1d20'
        },
        monster_toughness_dice: function () {
            return this.monster_berserker ? '2d20' : '1d20'
        },
        player_is_dead: function () {
            return this.player_life <= 0;
        },
        monster_is_dead: function () {
            return this.monster_life <= 0;
        },
        player_potions_are_over: function () {
            return this.player_potions <= 0;
        }
    },
    mounted: function () {
        // Initialize Life
        this.player_life = this.player_life_total;
        this.monster_life = this.monster_life_total;

        // Start sounds
        this.sound_list.forEach(function(sound_name){
            sounds[sound_name[0]] = document.getElementById(
                'sound_'+sound_name[0]
            );
        });

        // Start Queue Manager
        queue_manager = new QueueManager(500);
    },
    methods: {
        log: function (text) {
            // Writes at History Log
            this.log_list.push([get_timestamp(), text]);
        },
        roll_dice(subject, dices){
            // Roll a dice, log and return the result
            var dice = new Dice();
            var result = dice.roll(dices);
            enqueue_execution(do_log, [subject + ' rolled ' + dices + '.']);

            if (result.critical > 0)
                enqueue_execution(
                    do_log_with_sound, ['We have a CRITICAL ROLL!', 'alert']
                );

            if (result.failute > 0)
                enqueue_execution(
                    do_log_with_sound, ['We have a FAILURE ROLL!', 'alert']
                );

            enqueue_execution(do_log(dice.verbose()));

            if (subject == 'Player') {
                app.player_rolled = result;
            } else if (subject == 'Monster') {
                app.monster_rolled = result;
            }
        }
    }
});

window.onload = function() {
    // Loop Background Music
    sounds['theme'].addEventListener('ended', function () {
        this.currentTime = 0;
        this.play();
    }, false);
};