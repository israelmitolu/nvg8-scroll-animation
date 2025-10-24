import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

document.addEventListener("DOMContentLoaded", () => {
  gsap.registerPlugin(ScrollTrigger);

  const lenis = new Lenis();
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  const animatedIcons = document.querySelector(".animated-icons");
  const iconElementsNodeList = document.querySelectorAll(".animated-icon");
  let iconElements = Array.from(iconElementsNodeList);
  const textSegments = document.querySelectorAll(".text-segment");
  const placeholders = document.querySelectorAll(".placeholder-icon");
  const heroHeader = document.querySelector(".hero-header");
  const heroSection = document.querySelector(".hero");

  let restingAnimation;
  let scrollTimeout;

  const createRestingAnimation = () => {
    const tl = gsap.timeline({
      repeat: -1,
      paused: true,
      onRepeat: () => swapIcons(tl),
    });

    const swapIcons = (timeline) => {
      if (!timeline) timeline = tl;
      timeline.clear();

      const iconCount = iconElements.length;
      if (iconCount < 4) return;

      let i1;
      let i2;
      let possibleI2 = [];

      while (possibleI2.length === 0) {
        i1 = Math.floor(Math.random() * iconCount);
        const tempPossible = [];
        for (let i = 0; i < iconCount; i++) {
          if (Math.abs(i - i1) > 1) {
            tempPossible.push(i);
          }
        }
        possibleI2 = tempPossible;
      }

      i2 = possibleI2[Math.floor(Math.random() * possibleI2.length)];

      const icon1 = iconElements[i1];
      const icon2 = iconElements[i2];

      timeline.to([icon1, icon2], {
        scale: 0,
        duration: 0.4,
        ease: "power2.in",
      });

      timeline.add(() => {
        const parent = icon1.parentNode;
        const icon1NextSibling = icon1.nextSibling;
        const icon2NextSibling = icon2.nextSibling;

        if (icon1NextSibling === icon2) {
          parent.insertBefore(icon2, icon1);
        } else if (icon2NextSibling === icon1) {
          parent.insertBefore(icon1, icon2);
        } else {
          parent.insertBefore(icon2, icon1NextSibling);
          parent.insertBefore(icon1, icon2NextSibling);
        }

        iconElements = Array.from(parent.querySelectorAll(".animated-icon"));
      });

      timeline.to([icon1, icon2], {
        scale: 1,
        duration: 0.4,
        ease: "power2.out",
      });

      timeline.to({}, { duration: 1 });
    };

    swapIcons(tl);
    return tl;
  };

  restingAnimation = createRestingAnimation();

  if (lenis.scroll === 0) {
    restingAnimation.play();
  }

  lenis.on("scroll", (e) => {
    if (restingAnimation.isPlaying()) {
      restingAnimation.pause();
    }
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      if (e.scroll === 0) {
        restingAnimation.play();
      }
    }, 150);
  });

  const textAnimationOrder = [];
  textSegments.forEach((segment, index) => {
    textAnimationOrder.push({ segment, originalIndex: index });
  });

  for (let i = textAnimationOrder.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [textAnimationOrder[i], textAnimationOrder[j]] = [
      textAnimationOrder[j],
      textAnimationOrder[i],
    ];
  }

  const isMobile = window.innerWidth <= 1000;
  const headerIconSize = isMobile ? 30 : 60;
  const currentIconSize = iconElements[0].getBoundingClientRect().width;
  const exactScale = headerIconSize / currentIconSize;

  ScrollTrigger.create({
    trigger: ".hero",
    start: "top top",
    end: `+=${window.innerHeight * 8}px`,
    pin: true,
    pinSpacing: true,
    scrub: 1,
    onUpdate: (self) => {
      const progress = self.progress;

      textSegments.forEach((segment) => {
        gsap.set(segment, { opacity: 0 });
      });

      if (progress <= 0.3) {
        const moveProgress = progress / 0.3;
        const containerMoveY = -window.innerHeight * 0.3 * moveProgress;

        if (progress <= 0.15) {
          const headerProgress = progress / 0.15;
          const headerMoveY = -50 * headerProgress;
          const headerOpacity = 1 - headerProgress;

          gsap.set(heroHeader, {
            transform: `translate(-50%, calc(-50% + ${headerMoveY}px))`,
            opacity: headerOpacity,
          });
        } else {
          gsap.set(heroHeader, {
            transform: `translate(-50%, calc(-50% + -50px))`,
            opacity: 0,
          });
        }

        if (window.duplicateIcons) {
          window.duplicateIcons.forEach((duplicate) => {
            if (duplicate.parentNode) {
              duplicate.parentNode.removeChild(duplicate);
            }
          });
          window.duplicateIcons = null;
        }

        gsap.set(animatedIcons, {
          x: 0,
          y: containerMoveY,
          scale: 1,
          opacity: 1,
        });

        iconElements.forEach((icon, index) => {
          const staggerDelay = index * 0.1;
          const iconStart = staggerDelay;
          const iconEnd = staggerDelay + 0.5;

          const iconProgress = gsap.utils.mapRange(
            iconStart,
            iconEnd,
            0,
            1,
            moveProgress
          );
          const clampedProgress = Math.max(0, Math.min(1, iconProgress));

          const startOffset = -containerMoveY;
          const individualY = startOffset * (1 - clampedProgress);

          gsap.set(icon, {
            x: 0,
            y: individualY,
          });
        });
      } else if (progress <= 0.6) {
        const scaleProgress = (progress - 0.3) / 0.3;

        gsap.set(heroHeader, {
          transform: `translate(-50%, calc(-50% + -50px))`,
          opacity: 0,
        });

        if (scaleProgress >= 0.5) {
          heroSection.style.backgroundColor = "#e3e3db";
        } else {
          heroSection.style.backgroundColor = "#141414";
        }

        if (window.duplicateIcons) {
          window.duplicateIcons.forEach((duplicate) => {
            if (duplicate.parentNode) {
              duplicate.parentNode.removeChild(duplicate);
            }
          });
          window.duplicateIcons = null;
        }

        const targetCenterY = window.innerHeight / 2;
        const targetCenterX = window.innerWidth / 2;
        const containerRect = animatedIcons.getBoundingClientRect();
        const currentCenterX = containerRect.left + containerRect.width / 2;
        const currentCenterY = containerRect.top + containerRect.height / 2;
        const deltaX = (targetCenterX - currentCenterX) * scaleProgress;
        const deltaY = (targetCenterY - currentCenterY) * scaleProgress;
        const baseY = -window.innerHeight * 0.3;
        const currentScale = 1 + (exactScale - 1) * scaleProgress;

        gsap.set(animatedIcons, {
          x: deltaX,
          y: baseY + deltaY,
          scale: currentScale,
          opacity: 1,
        });

        iconElements.forEach((icon) => {
          gsap.set(icon, { x: 0, y: 0 });
        });
      } else if (progress <= 0.75) {
        const moveProgress = (progress - 0.6) / 0.15;

        gsap.set(heroHeader, {
          transform: `translate(-50%, calc(-50% + -50px))`,
          opacity: 0,
        });

        heroSection.style.backgroundColor = "#e3e3db";

        const targetCenterY = window.innerHeight / 2;
        const targetCenterX = window.innerWidth / 2;
        const containerRect = animatedIcons.getBoundingClientRect();
        const currentCenterX = containerRect.left + containerRect.width / 2;
        const currentCenterY = containerRect.top + containerRect.height / 2;
        const deltaX = targetCenterX - currentCenterX;
        const deltaY = targetCenterY - currentCenterY;
        const baseY = -window.innerHeight * 0.3;

        gsap.set(animatedIcons, {
          x: deltaX,
          y: baseY + deltaY,
          scale: exactScale,
          opacity: 0,
        });

        iconElements.forEach((icon) => {
          gsap.set(icon, { x: 0, y: 0 });
        });

        if (!window.duplicateIcons) {
          window.duplicateIcons = [];

          iconElements.forEach((icon, index) => {
            const duplicate = icon.cloneNode(true);
            duplicate.className = "duplicate-icon";
            duplicate.style.position = "absolute";
            duplicate.style.width = headerIconSize + "px";
            duplicate.style.height = headerIconSize + "px";

            document.body.appendChild(duplicate);
            window.duplicateIcons.push(duplicate);
          });
        }

        if (window.duplicateIcons) {
          window.duplicateIcons.forEach((duplicate, index) => {
            if (index < placeholders.length) {
              const iconRect = iconElements[index].getBoundingClientRect();
              const startCenterX = iconRect.left + iconRect.width / 2;
              const startCenterY = iconRect.top + iconRect.height / 2;
              const startPageX = startCenterX + window.pageXOffset;
              const startPageY = startCenterY + window.pageYOffset;

              const targetRect = placeholders[index].getBoundingClientRect();
              const targetCenterX = targetRect.left + targetRect.width / 2;
              const targetCenterY = targetRect.top + targetRect.height / 2;
              const targetPageX = targetCenterX + window.pageXOffset;
              const targetPageY = targetCenterY + window.pageYOffset;

              const moveX = targetPageX - startPageX;
              const moveY = targetPageY - startPageY;

              let currentX = 0;
              let currentY = 0;

              if (moveProgress <= 0.5) {
                const verticalProgress = moveProgress / 0.5;
                currentY = moveY * verticalProgress;
              } else {
                const horizontalProgress = (moveProgress - 0.5) / 0.5;
                currentY = moveY;
                currentX = moveX * horizontalProgress;
              }

              const finalPageX = startPageX + currentX;
              const finalPageY = startPageY + currentY;

              duplicate.style.left = finalPageX - headerIconSize / 2 + "px";
              duplicate.style.top = finalPageY - headerIconSize / 2 + "px";
              duplicate.style.opacity = "1";
              duplicate.style.display = "flex";
            }
          });
        }
      } else {
        gsap.set(heroHeader, {
          transform: `translate(-50%, calc(-50% + -100px))`,
          opacity: 0,
        });

        heroSection.style.backgroundColor = "#e3e3db";

        gsap.set(animatedIcons, { opacity: 0 });

        if (window.duplicateIcons) {
          window.duplicateIcons.forEach((duplicate, index) => {
            if (index < placeholders.length) {
              const targetRect = placeholders[index].getBoundingClientRect();
              const targetCenterX = targetRect.left + targetRect.width / 2;
              const targetCenterY = targetRect.top + targetRect.height / 2;
              const targetPageX = targetCenterX + window.pageXOffset;
              const targetPageY = targetCenterY + window.pageYOffset;

              duplicate.style.left = targetPageX - headerIconSize / 2 + "px";
              duplicate.style.top = targetPageY - headerIconSize / 2 + "px";
              duplicate.style.opacity = "1";
              duplicate.style.display = "flex";
            }
          });
        }

        textAnimationOrder.forEach((item, randomIndex) => {
          const segmentStart = 0.75 + randomIndex * 0.03;
          const segmentEnd = segmentStart + 0.015;

          const segmentProgress = gsap.utils.mapRange(
            segmentStart,
            segmentEnd,
            0,
            1,
            progress
          );
          const clampedProgress = Math.max(0, Math.min(1, segmentProgress));

          gsap.set(item.segment, {
            opacity: clampedProgress,
          });
        });
      }
    },
  });
});
