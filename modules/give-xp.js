import { Sidekick } from "./sidekick.js";
import { SETTING_KEYS } from "./butler.js";

export class GiveXP {

    /**
     * Render dialog handler
     * @param {*} app 
     * @param {*} html 
     * @param {*} data 
     */
    static _onRenderDialog(app, html, data) {
        const enable = Sidekick.getSetting(SETTING_KEYS.giveXP.enable);

        if (!game.user.isGM || !enable) {
            return;
        }

        const dialogContent = html.find("div.dialog-content");
        const yesButton = html.find("button[data-button='yes']");
        const xpCheckboxGroup = $(`<div class="form-group"><label class="checkbox">Award XP? <input type="checkbox" name="award-xp"></label></div>`);

        dialogContent.after(xpCheckboxGroup);

        app.setPosition(mergeObject(app.position, {height: app.position.height + 30}));

        yesButton.on("click", event => {
            const xpCheckbox = xpCheckboxGroup.find("input");
            if (xpCheckbox.is(":checked")) {
                Hooks.once("deleteCombat", (combat, update, options, userId) => {
                    GiveXP._giveXP(combat);
                });
            }
        });

    }

    /**
     * Gives XP to the living PCs in the turn tracker based on enemies killed
     * @param {Object} combat -- the combat instance being deleted
     */
    static _giveXP(combat) {
        const defeatedEnemies = combat.turns.filter(object => (!object.actor.isPC && object.defeated && object.token.disposition === -1));
        const playerCombatants = combat.turns.filter(object => (object.actor.isPC && !object.defeated));
        let experience = 0;

        if (defeatedEnemies.length === 0 || playerCombatants.length === 0) {
            return;
        }
                var multipliers = [0.5,1,1.5,2,2,2,2,2.5,2.5,2.5,2.5,3,3,3,3,4];
        var nbrEnemies = defeatedEnemies.length;
        if( playerCombatants.length<3){nbrEnemies+=1;}
        else if ( playerCombatants.length>=6)
        {
            nbrEnemies-=1;
        }
        var mult = nbrEnemies>=15? 4:multipliers[nbrEnemies];
       

        defeatedEnemies.forEach(enemy => experience += enemy.actor.data.data.details.xp.value);
        experience*=mult;
        //defeatedEnemies.forEach(enemy => experience += enemy.actor.data.data.details.xp.value);
        const dividedExperience = Math.floor(experience / playerCombatants.length);

        let experienceMessage = "<b>Experience Awarded!</b> (" + experience + "xp)<p><b>" + dividedExperience + "xp </b> added to:</br>";

        playerCombatants.forEach(async combatant => {
            const actor = game.actors.entities.find(actor => actor.id === combatant.actor.data._id);

            GiveXP.applyXP(actor, dividedExperience);
            experienceMessage += actor.name + "<br>";
        });
        experienceMessage += "</p>";
        
        GiveXP.outputToChat(experienceMessage);
    }

    /**
     * Appl
     * @param {*} actor 
     */
    static async applyXP(actor, amount) {
        return await actor.update({
            "data.details.xp.value": actor.data.data.details.xp.value + amount
        });
    }
    
    /**
     * Creates a chat message and outputs to chat
     */
    static outputToChat(content) {
        const user = game.userId,
            alias = "CUB Experience",
            type = CONST.CHAT_MESSAGE_TYPES.OTHER;

        ChatMessage.create({
            user,
            speaker: {
                alias
            },
            content,
            type
        });
    }
}
