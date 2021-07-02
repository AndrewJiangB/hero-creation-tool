/* Coco Liang
 version 0.1
 This object is a pop-up window to edit the actor's inital levels and stuffs
 */
import * as Constants from './constants';
import * as Utils from './utils';
import HeroData from './HeroData';

import BasicsTab from './tabs/basicsStep';
import AbilitiesTab from './tabs/abilitiesStep';
import RaceTab from './tabs/raceStep';
import ClassTab from './tabs/classStep';
import BackgroundTab from './tabs/backgroundStep';
import EquipmentTab from './tabs/equipmentStep';
import SpellsTab from './tabs/spellsStep';
import BioTab from './tabs/bioStep';
import { Step } from './Step';
import { HeroOption } from './HeroOption';

export default class App extends Application {
    actorId?: string;
    readonly steps: Array<Step>;

    constructor() {
        super();
        this.actorId = undefined;
        this.steps = [BasicsTab, AbilitiesTab, RaceTab, ClassTab, BackgroundTab, EquipmentTab, SpellsTab, BioTab];
    }

    static get defaultOptions() {
        const options = super.defaultOptions;
        options.template = Constants.MODULE_PATH + '/templates/app.html';
        options.width = 1000;
        options.height = 700;
        return options;
    }

    async openForActor(actorId?: string) {
        this.options.title = game.i18n.localize('HCT.WindowTitle');
        console.log(`${Constants.LOG_PREFIX} | Opening for ${actorId ? 'actor id: ' + actorId : 'new actor'}`);
        if (actorId) this.actorId = actorId;
        for (const step of this.steps) {
            step.clearOptions();
        }
        this.render(true, { log: true });
    }

    activateListeners() {
        console.log(`${Constants.LOG_PREFIX} | Binding listeners`);

        $('[data-hct_submit]').on('click', (event) => {
            this.buildActor();
        });

        Utils.openTab('startDiv');
    }

    async setupData() {
        for (const step of this.steps) {
            step.setSourceData();
        }
    }

    renderChildrenData() {
        for (const step of this.steps) {
            step.renderData();
        }
    }

    private async buildActor() {
        console.log(`${Constants.LOG_PREFIX} | Building actor`);
        const newActor = new HeroData();
        let errors = false;
        // yeah, a loop label, sue me.
        mainloop: for (const step of this.steps) {
            for (const opt of step.getOptions()) {
                if (this.requiredOptionNotFulfilled(opt)) {
                    errors = true;
                    break mainloop;
                }
                opt.applyToHero(newActor);
            }
        }
        if (!errors) {
            console.log(newActor);
            // calculate whatever needs inter-tab values like HP
            calculateStartingHp(newActor);

            Actor.create(newActor);
            this.close();
        }
    }

    private requiredOptionNotFulfilled(opt: HeroOption): boolean {
        const key = opt.key;
        if (key === 'name' && !opt.isFulfilled()) {
            // TODO consider if it would make sense to include a filter to make sure a race and class has been selected
            // on Foundry the only *required* field to create an actor is Name, as seen on Foundry's vanilla new actor window.
            const errorMessage = game.i18n.format('HCT.Creation.RequiredOptionNotFulfilled', { opt: opt.key });
            ui.notifications?.error(errorMessage);
            return true;
        }
        return false;
    }
}
function calculateStartingHp(newActor: HeroData) {
    const totalCon = newActor.data?.abilities?.con?.value;
    const raceAndConHp: number = totalCon ? Utils.getAbilityModifierValue(totalCon) : 0;
    const classHp: number = newActor.data?.attributes.hp.max
        ? Number.parseInt(newActor.data?.attributes.hp.max as any)
        : 10;

    const startingHp = raceAndConHp + classHp;
    console.log(`Starting HP: ${startingHp}`);
    newActor.data!.attributes.hp.max = startingHp;
    newActor.data!.attributes.hp.value = startingHp;
}
