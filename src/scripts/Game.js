const GAME_CLASS = "js-game";

const GAME_SELECTOR = ".js-game";

const GAME_SCORE_SELECTOR = `.${GAME_CLASS}__score`;
const GAME_SCORE_WRAP_SELECTOR = `.${GAME_CLASS}__score-wrap`;
const GAME_COLORS_SELECTOR = `.${GAME_CLASS}__colors`;
const GAME_COLOR_SELECTOR = `.${GAME_CLASS}__color`;
const GAME_GUESS_SELECTOR = `.${GAME_CLASS}__guess`;
const GAME_TITLE_SELECTOR = `.${GAME_CLASS}__title`;

const HOVER_CLASS = "hover";
const ACTIVE_CLASS = "active";
const ERROR_CLASS = "error";
const HIDDEN_CLASS = "hidden";

const LOSS_STATUS = "TRY ADAIN";

const DEFAULT_TITLE = "try to guess the color";

export class Game {
    constructor(wrap) {
        this.wrap = wrap;

        this.scoreEl = document.querySelector(GAME_SCORE_SELECTOR);
        this.scoreWrap = document.querySelector(GAME_SCORE_WRAP_SELECTOR);
        this.colors = document.querySelector(GAME_COLORS_SELECTOR);
        this.colorsList = document.querySelectorAll(GAME_COLOR_SELECTOR);
        this.guessWrap = document.querySelector(GAME_GUESS_SELECTOR);

        this.title = document.querySelector(GAME_TITLE_SELECTOR);

        this.selectedColor = null;
        this.score = 0;
        this.scoreTimer = undefined;

        this.stepCounter = 0;
        this.maxStep = 1;

        this.#initComponent();
    }

    #initComponent = () => {
        this.colorsList.forEach((el, index) => {
            el.addEventListener("mouseenter", () => {
                el.classList.add(ACTIVE_CLASS);
                this.colors?.classList.add(HOVER_CLASS);
            });
            el.addEventListener("mouseleave", () => {
                el.classList.remove(ACTIVE_CLASS);
                this.colors?.classList.remove(HOVER_CLASS);
            });
            el.addEventListener("click", () => {
                this.selectedColor = index;
                this.#hideGuesser();

                this.stepCounter = 0;

                let selectColorEvent = new Event("selectColor");
                this.wrap.dispatchEvent(selectColorEvent);
            });
        });
    };

    #hideGuesser = () => {
        this.guessWrap?.classList.add(HIDDEN_CLASS);
    };

    #showGuesser = () => {
        this.guessWrap?.classList.remove(HIDDEN_CLASS);
    };

    checkAnswer = (color) => {
        this.stepCounter += 1;
        if (this.stepCounter !== this.maxStep) return;
        if (color === this.selectedColor) {
            this.increaseScore();
        } else {
            this.resetScore();
        }

        setTimeout(() => {
            this.#showGuesser();
        }, 1000);
    };

    increaseScore = () => {
        this.score += 1;
        this.updateScoreEl(false);
    };

    resetScore = () => {
        this.score = 0;
        this.updateScoreEl();
    };

    updateScoreEl = (isError = true) => {
        clearTimeout(this.scoreTimer);

        let statusClass = isError ? ERROR_CLASS : ACTIVE_CLASS;

        if (this.scoreEl) {
            this.scoreEl.textContent = this.score.toString();

            this.scoreWrap?.classList.add(statusClass);

            this.scoreTimer = setTimeout(() => {
                this.scoreWrap?.classList.remove(statusClass);
            }, 500);
        }

        this.updateTitle();
    };

    updateTitle = () => {
        if (!this.title) return;
        let titleText = DEFAULT_TITLE;

        switch (this.score) {
            case 0:
                titleText = "Oops, start again!";
                break;
            case 2:
                titleText = "no way!";
                break;
            case 4:
                titleText = "incredible!";
                break;
            case 5:
                titleText = "How do you do that, mate??";
                break;
            case 6:
                titleText = "Don't believe you";
                break;
            case 7:
                titleText = "Oh, come on!";
                break;
            case 8:
                titleText = "I give up";
                break;
            case 9:
                titleText = "Prove that you're not a robot";
                break;
            case 10:
                titleText = "You've won.";
                break;
            default:
                titleText = "nice, try the next one!";
                break;
        }
        this.title.textContent = titleText;
    };
}

export const initGame = () => {
    let wrap = document.querySelector(GAME_SELECTOR);
    if (!wrap) return null;
    return new Game(wrap);
};
