'use client';

import Image from 'next/image';
import { motion } from 'motion/react';

export default function FloatingEmotes() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
      {/* Top Left Quadrant */}
      <motion.div 
        className="absolute opacity-25 w-16 h-16"
        style={{ top: '8%', left: '5%' }}
        animate={{
          y: [-40, 40, -40],
          x: [-30, 30, -30],
          rotate: [-8, 8, -8],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <Image 
          src="https://cdn.7tv.app/emote/01GQDWJFE8000DXPT9P91R886X/4x.webp" 
          alt="7tv emote" 
          width={64} 
          height={64} 
          className="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(139,92,246,0.5)]" 
        />
      </motion.div>

      {/* Top Right Quadrant */}
      <motion.div 
        className="absolute opacity-25 w-14 h-14"
        style={{ top: '12%', right: '8%' }}
        animate={{
          x: [-35, 35, -35],
          y: [-45, 45, -45],
          rotate: [-10, 10, -10]
        }}
        transition={{
          duration: 10,
          delay: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <Image 
          src="https://cdn.7tv.app/emote/01HBJDX670000ECTPKPBM89SP5/4x.webp" 
          alt="7tv emote" 
          width={56} 
          height={56} 
          className="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(234,88,12,0.5)]" 
        />
      </motion.div>

      {/* Middle Left */}
      <motion.div 
        className="absolute opacity-25 w-12 h-12"
        style={{ top: '45%', left: '10%' }}
        animate={{
          x: [-38, 38, -38],
          y: [-50, 50, -50],
          rotate: [-9, 9, -9]
        }}
        transition={{
          duration: 14,
          delay: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <Image 
          src="https://cdn.7tv.app/emote/01GCSMJ3780004ZMF9GMF8X3SE/4x.webp" 
          alt="7tv emote" 
          width={48} 
          height={48} 
          className="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(139,92,246,0.5)]" 
        />
      </motion.div>

      {/* Middle Right */}
      <motion.div 
        className="absolute w-14 h-14"
        style={{ top: '38%', right: '15%' }}
        animate={{
          y: [-42, 42, -42],
          x: [-28, 28, -28],
          scale: [1, 1.08, 1],
          opacity: [0.25, 0.3, 0.25]
        }}
        transition={{
          duration: 13,
          delay: 0.8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <Image 
          src="https://cdn.7tv.app/emote/01K4ZTWC6HR7BM0PP7XAM7V326/4x.webp" 
          alt="7tv emote" 
          width={56} 
          height={56} 
          className="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(234,88,12,0.5)]" 
        />
      </motion.div>

      {/* Center */}
      <motion.div 
        className="absolute opacity-25 w-12 h-12"
        style={{ top: '55%', left: '48%' }}
        animate={{
          y: [-45, 45, -45],
          x: [-32, 32, -32],
          rotate: [-7, 7, -7]
        }}
        transition={{
          duration: 12,
          delay: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <Image 
          src="https://cdn.7tv.app/emote/01J9BG043R0006G7P3TC1QGQ94/4x.webp" 
          alt="7tv emote" 
          width={48} 
          height={48} 
          className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]" 
        />
      </motion.div>

      {/* Bottom Left */}
      <motion.div 
        className="absolute opacity-20 w-14 h-14"
        style={{ bottom: '20%', left: '18%' }}
        animate={{
          y: [-48, 48, -48],
          x: [-35, 35, -35],
          rotate: [-12, 12, -12]
        }}
        transition={{
          duration: 13,
          delay: 3.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <Image 
          src="https://cdn.7tv.app/emote/01J6J6S908000CKHTDYB3M9V8N/4x.webp" 
          alt="7tv emote" 
          width={56} 
          height={56} 
          className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(234,88,12,0.5)]" 
        />
      </motion.div>

      {/* Bottom Right */}
      <motion.div 
        className="absolute opacity-20 w-10 h-10"
        style={{ bottom: '25%', right: '12%' }}
        animate={{
          x: [-40, 40, -40],
          y: [-38, 38, -38],
          rotate: [-8, 8, -8]
        }}
        transition={{
          duration: 11,
          delay: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <Image 
          src="https://cdn.7tv.app/emote/01GEV0BG9G000BQ5E4E4CKHW2F/4x.webp" 
          alt="7tv emote" 
          width={40} 
          height={40} 
          className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]" 
        />
      </motion.div>

      {/* Lower Left */}
      <motion.div 
        className="absolute opacity-20 w-12 h-12"
        style={{ bottom: '10%', left: '25%' }}
        animate={{
          y: [-44, 44, -44],
          x: [-30, 30, -30],
          rotate: [-9, 9, -9]
        }}
        transition={{
          duration: 15,
          delay: 1.2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <Image 
          src="https://cdn.7tv.app/emote/01GE0J4D1G0009034YX2RWKQDB/4x.webp" 
          alt="7tv emote" 
          width={48} 
          height={48} 
          className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(234,88,12,0.5)]" 
        />
      </motion.div>

      {/* Bottom Center */}
      <motion.div 
        className="absolute w-14 h-14"
        style={{ bottom: '15%', left: '55%' }}
        animate={{
          y: [-46, 46, -46],
          x: [-33, 33, -33],
          scale: [1, 1.06, 1],
          opacity: [0.25, 0.29, 0.25]
        }}
        transition={{
          duration: 16,
          delay: 5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <Image 
          src="https://cdn.7tv.app/emote/01GF1T498R000BJ4F8N4T654Q4/4x.webp" 
          alt="7tv emote" 
          width={56} 
          height={56} 
          className="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(139,92,246,0.5)]" 
        />
      </motion.div>

      {/* Top Right Corner */}
      <motion.div 
        className="absolute opacity-20 w-16 h-16"
        style={{ top: '5%', right: '20%' }}
        animate={{
          y: [-40, 40, -40],
          x: [-28, 28, -28],
          rotate: [-10, 10, -10]
        }}
        transition={{
          duration: 13,
          delay: 0.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <Image 
          src="/media/img/skeletonPls.gif" 
          alt="skeleton" 
          width={64} 
          height={64} 
          className="w-full h-full object-contain" 
          unoptimized 
        />
      </motion.div>

      {/* Bottom Left Corner */}
      <motion.div 
        className="absolute opacity-20 w-14 h-14"
        style={{ bottom: '8%', left: '8%' }}
        animate={{
          y: [-50, 50, -50],
          x: [-36, 36, -36],
          rotate: [-8, 8, -8]
        }}
        transition={{
          duration: 16,
          delay: 2.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <Image 
          src="/media/img/skeletonPls.gif" 
          alt="skeleton" 
          width={56} 
          height={56} 
          className="w-full h-full object-contain" 
          unoptimized 
        />
      </motion.div>

      {/* Middle Right Area */}
      <motion.div 
        className="absolute opacity-20 w-12 h-12"
        style={{ top: '60%', right: '22%' }}
        animate={{
          y: [-43, 43, -43],
          x: [-31, 31, -31],
          rotate: [-9, 9, -9]
        }}
        transition={{
          duration: 12,
          delay: 4.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <Image 
          src="/media/img/POGGERS.webp" 
          alt="poggers" 
          width={48} 
          height={48} 
          className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(234,88,12,0.5)]" 
        />
      </motion.div>

      {/* Lower Right Area */}
      <motion.div 
        className="absolute opacity-20 w-10 h-10"
        style={{ bottom: '35%', right: '28%' }}
        animate={{
          y: [-38, 38, -38],
          x: [-26, 26, -26],
          rotate: [-7, 7, -7]
        }}
        transition={{
          duration: 14,
          delay: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <Image 
          src="/media/img/skibenDEVIL.webp" 
          alt="devil" 
          width={40} 
          height={40} 
          className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(234,88,12,0.5)]" 
        />
      </motion.div>

      {/* Upper Middle Left */}
      <motion.div 
        className="absolute w-10 h-10"
        style={{ top: '28%', left: '22%' }}
        animate={{
          y: [-42, 42, -42],
          x: [-29, 29, -29],
          opacity: [0.2, 0.24, 0.2]
        }}
        transition={{
          duration: 11,
          delay: 3.2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <Image 
          src="/media/img/skibenDOC.webp" 
          alt="doc" 
          width={40} 
          height={40} 
          className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]" 
        />
      </motion.div>

      {/* Upper Left Area */}
      <motion.div 
        className="absolute opacity-25 w-16 h-16"
        style={{ top: '18%', left: '35%' }}
        animate={{
          y: [-52, 52, -52],
          x: [-38, 38, -38],
          rotate: [-11, 11, -11]
        }}
        transition={{
          duration: 14,
          delay: 4.8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <Image 
          src="https://cdn.7tv.app/emote/01FSNM69NG0000JPZ36BHMFR18/4x.webp" 
          alt="7tv emote" 
          width={64} 
          height={64} 
          className="w-full h-full object-contain drop-shadow-[0_0_12px_rgba(139,92,246,0.6)]" 
        />
      </motion.div>

      {/* Lower Middle Area */}
      <motion.div 
        className="absolute opacity-20 w-12 h-12"
        style={{ bottom: '42%', left: '62%' }}
        animate={{
          y: [-47, 47, -47],
          x: [-34, 34, -34],
          rotate: [-8, 8, -8]
        }}
        transition={{
          duration: 17,
          delay: 7,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <Image 
          src="https://cdn.7tv.app/emote/01FSNM69NG0000JPZ36BHMFR18/4x.webp" 
          alt="7tv emote" 
          width={48} 
          height={48} 
          className="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(234,88,12,0.5)]" 
        />
      </motion.div>

      {/* Far Top Right */}
      <motion.div 
        className="absolute opacity-22 w-14 h-14"
        style={{ top: '15%', right: '35%' }}
        animate={{
          y: [-45, 45, -45],
          x: [-32, 32, -32],
          rotate: [-9, 9, -9]
        }}
        transition={{
          duration: 11,
          delay: 5.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <Image 
          src="/media/img/baldshi.png" 
          alt="baldshi" 
          width={56} 
          height={56} 
          className="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(139,92,246,0.5)]" 
        />
      </motion.div>

      {/* Far Bottom Right */}
      <motion.div 
        className="absolute opacity-22 w-12 h-12"
        style={{ bottom: '5%', right: '35%' }}
        animate={{
          y: [-43, 43, -43],
          x: [-33, 33, -33],
          rotate: [-8, 8, -8]
        }}
        transition={{
          duration: 15,
          delay: 6.8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <Image 
          src="https://cdn.7tv.app/emote/01GCWTP1E8000AJWRCAR55RR40/4x.webp" 
          alt="7tv emote" 
          width={48} 
          height={48} 
          className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(234,88,12,0.5)]" 
        />
      </motion.div>

      {/* Far Left Middle */}
      <motion.div 
        className="absolute opacity-20 w-13 h-13"
        style={{ top: '70%', left: '5%' }}
        animate={{
          y: [-40, 40, -40],
          x: [-28, 28, -28],
          rotate: [-7, 7, -7]
        }}
        transition={{
          duration: 13,
          delay: 3.8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <Image 
          src="/media/img/POGGERS.webp" 
          alt="poggers" 
          width={52} 
          height={52} 
          className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(234,88,12,0.5)]" 
        />
      </motion.div>
    </div>
  );
}

