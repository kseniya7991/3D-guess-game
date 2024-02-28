const GAME_CLASS = "js-game";

const GAME_SELECTOR = ".js-game";

const GAME_SCORE_SELECTOR = `.${GAME_CLASS}__score`;
const GAME_COLORS_SELECTOR = `.${GAME_CLASS}__colors`;
const GAME_COLOR_SELECTOR = `.${GAME_CLASS}__color`;
const GAME_GUESS_SELECTOR = `.${GAME_CLASS}__guess`;

const HOVER_CLASS = "hover";
const ACTIVE_CLASS = "active";
const HIDDEN_CLASS = "hidden";

const LOSS_STATUS = "TRY ADAIN";

export class Game {
    constructor(wrap) {
        this.wrap = wrap;

        this.scoreEl = document.querySelector(GAME_SCORE_SELECTOR);
        this.colors = document.querySelector(GAME_COLORS_SELECTOR);
        this.colorsList = document.querySelectorAll(GAME_COLOR_SELECTOR);
        this.guessWrap = document.querySelector(GAME_GUESS_SELECTOR);

        this.selectedColor = null;
        this.score = 0;

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
        this.updateScoreEl();
    };

    resetScore = () => {
        this.score = 0;
        this.updateScoreEl();
    };

    updateScoreEl = () => {
        if (this.scoreEl) {
            this.scoreEl.textContent = this.score.toString();
        }
    };
}

export const initGame = () => {
    let wrap = document.querySelector(GAME_SELECTOR);
    if (!wrap) return null;
    return new Game(wrap);
};
