"use client";

import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import type { VideoFeature } from "@/types";

type ProductVideoCardProps = {
  feature: VideoFeature;
};

export function ProductVideoCard({ feature }: ProductVideoCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  const playVideo = useCallback(async () => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    try {
      video.muted = isMuted;
      await video.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    }
  }, [isMuted]);

  const pauseVideo = useCallback(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    video.pause();
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    video.muted = isMuted;
  }, [isMuted]);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          void playVideo();
          return;
        }

        pauseVideo();
      },
      { threshold: 0.45 },
    );

    observer.observe(video);

    return () => observer.disconnect();
  }, [pauseVideo, playVideo]);

  const togglePlay = () => {
    if (isPlaying) {
      pauseVideo();
      return;
    }

    void playVideo();
  };

  const toggleMute = () => {
    const video = videoRef.current;
    const nextMuted = !isMuted;

    if (video) {
      video.muted = nextMuted;
    }

    setIsMuted(nextMuted);
  };

  return (
    <article className="card-hover overflow-hidden rounded-xl border border-border bg-black shadow-[var(--shadow-soft)]">
      <div className="relative aspect-video overflow-hidden lg:aspect-[16/7]">
        <video
          ref={videoRef}
          aria-label={feature.video.alt}
          className="h-full w-full object-cover"
          loop
          muted={isMuted}
          playsInline
          poster={feature.poster.src}
          preload="metadata"
          onPause={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
        >
          <source src={feature.video.src} type={feature.video.type} />
          This video cannot play in your browser.
        </video>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/55 to-transparent" />

        <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-lg border border-white/20 bg-black/45 p-2 shadow-lg backdrop-blur-md">
          <button
            type="button"
            aria-label={isPlaying ? "Pause product video" : "Play product video"}
            className="grid h-10 w-12 place-items-center rounded-md bg-white text-slate-950 transition hover:bg-accent focus:outline-none focus:ring-2 focus:ring-accent"
            onClick={togglePlay}
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause aria-hidden="true" size={18} />
            ) : (
              <Play aria-hidden="true" size={18} fill="currentColor" />
            )}
          </button>
          <button
            type="button"
            aria-label={
              isMuted ? "Unmute product video" : "Mute product video"
            }
            className="grid h-10 w-12 place-items-center rounded-md bg-white text-slate-950 transition hover:bg-accent focus:outline-none focus:ring-2 focus:ring-accent"
            onClick={toggleMute}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <VolumeX aria-hidden="true" size={18} />
            ) : (
              <Volume2 aria-hidden="true" size={18} />
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
