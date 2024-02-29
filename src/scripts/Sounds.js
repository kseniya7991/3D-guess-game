import { GAME_CLASS } from "./Game";
const ACTIVE_CLASS = "active";

let isMuted = false;

/**
 * Sound Switch
 */
export class SoundSwitch {
    constructor(wrap) {
        this.wrap = wrap;
        this.initComponent();
    }

    initComponent = () => {
        this.wrap.addEventListener("click", () => {
            this.wrap.classList.toggle(ACTIVE_CLASS);
            isMuted = !this.wrap.classList.contains(ACTIVE_CLASS);
        });
    };
}

/**
 * Sounds
 */
const sounds = [new Audio("/sounds/golf-ball.wav"), new Audio("/sounds/ball.wav")];

/**
 * Sound plays if:
 * @sphereShotBall  collide with balls
 * @balls collide with floor (prevent collide with each other)
 */

export const playHitSound = (collision, sphereShotBall, floorBody, isShotBall = false) => {
    let soundId = 0;
    let startVolume = 0.3;

    let impactStrength = collision.contact.getImpactVelocityAlongNormal();

    let isCollideWithFloor = false;
    let isCollideWithBalls = true;

    if (isShotBall) {
        soundId = 1;
        startVolume = 1;

        isCollideWithBalls = checkIsShotBallCollideWithBalls(isShotBall, sphereShotBall, collision);
    }

    if (!isCollideWithBalls && isShotBall) return;

    if (!isShotBall) {
        isCollideWithFloor = floorBody.id === collision.contact.bj.id;
    }

    let volume = calculateVolume(impactStrength, startVolume);
    if (shouldPlaySound(impactStrength, isCollideWithFloor, isShotBall)) {
        playSound(soundId, volume);
    }
};

const calculateVolume = (impactStrength, startVolume) => {
    if (impactStrength > 7) {
        return startVolume;
    } else if (impactStrength < 5 && impactStrength > 3) {
        return startVolume * 0.8;
    } else if (impactStrength < 3) {
        return startVolume * 0.2;
    } else {
        return startVolume;
    }
};

const shouldPlaySound = (impactStrength, isCollideWithFloor, isShotBall) => {
    return (impactStrength > 1.5 && isCollideWithFloor && !isShotBall) || (impactStrength > 1.5 && isShotBall);
};

const playSound = (soundId, volume) => {
    sounds[soundId].currentTime = 0;
    sounds[soundId].volume = isMuted ? 0 : volume;
    sounds[soundId].play();
};

const checkIsShotBallCollideWithBalls = (isShotBall, sphereShotBall, collision) => {
    return (
        isShotBall &&
        sphereShotBall &&
        collision.contact.bj.id !== sphereShotBall.id &&
        collision.contact.bj.id % 2 === 0
    );
};
