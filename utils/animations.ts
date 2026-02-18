import listeningAnimation from "../public/animations/assistant-listening.json";
import speakingAnimation from "../public/animations/assistant-speaking.json";
import stopAnimation from "../public/animations/assistant-stop.json";

export function getAnimation(speaking: boolean, listening: boolean) {
  if (speaking) return speakingAnimation;
  if (listening) return listeningAnimation;
  return stopAnimation;
}
