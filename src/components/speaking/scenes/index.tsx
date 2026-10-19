import type { ReactNode } from "react";
import type { SceneId } from "@/lib/speaking/scenes";
import {
  Bag,
  Bike,
  Book,
  Box,
  Building,
  C,
  Cloud,
  Cup,
  LINE,
  Laptop,
  Mountain,
  Person,
  Room,
  Seated,
  Sky,
  Sun,
  Table,
  Tree,
  Window,
} from "./parts";

/** Every scene listed in `SCENES`, drawn to match its description. */
export const SCENE_DRAWINGS: Record<SceneId, () => ReactNode> = {
  "street-market": () => (
    <>
      <Sky />
      <Cloud x={60} y={50} />
      {/* Stall with a striped awning */}
      <rect x={140} y={150} width={200} height={70} fill={C.gold} {...LINE} />
      <line x1={150} y1={220} x2={150} y2={250} {...LINE} />
      <line x1={330} y1={220} x2={330} y2={250} {...LINE} />
      <line x1={150} y1={90} x2={150} y2={150} {...LINE} />
      <line x1={330} y1={90} x2={330} y2={150} {...LINE} />
      {[0, 1, 2, 3, 4].map((i) => (
        <path
          key={i}
          d={`M${130 + i * 44} 80 h44 v18 a22 10 0 0 1 -44 0 z`}
          fill={i % 2 ? C.paper : C.wine}
          {...LINE}
        />
      ))}
      {/* Fruit and vegetables */}
      {[160, 180, 200, 220, 250, 270, 290, 310].map((x, i) => (
        <circle
          key={x}
          cx={x}
          cy={i % 2 ? 140 : 145}
          r={9}
          fill={[C.red, C.leaf, C.gold, C.green][i % 4]}
          {...LINE}
          strokeWidth={2}
        />
      ))}
      <Person x={240} y={175} h={70} shirt={C.green} pose="forward" />
      <Bag x={282} y={170} />
      <Person x={380} y={250} h={110} shirt={C.wine} pose="forward" flip />
      <Person x={425} y={250} h={100} shirt={C.leaf} flip />
    </>
  ),
  "family-picnic": () => (
    <>
      <Sky ground={210} />
      <Sun x={420} y={50} />
      <Tree x={80} y={210} h={170} />
      <path d="M140 270 L380 270 L420 230 L180 230 Z" fill={C.wine} {...LINE} />
      <Seated x={210} y={240} h={90} shirt={C.green} pose="hold" />
      <Seated x={340} y={240} h={90} shirt={C.gold} pose="hold" flip />
      <rect
        x={258}
        y={222}
        width={36}
        height={24}
        rx={3}
        fill={C.gold}
        {...LINE}
      />
      <path d="M262 222 a14 12 0 0 1 28 0" fill="none" {...LINE} />
      <Seated x={290} y={262} h={60} shirt={C.leaf} />
      <Person x={430} y={250} h={66} shirt={C.red} pose="up" flip />
      <circle cx={400} cy={170} r={11} fill={C.paper} {...LINE} />
    </>
  ),
  "open-plan-office": () => (
    <>
      <Room floor={250} />
      {/* Big window with city buildings */}
      <rect x={60} y={30} width={360} height={110} fill={C.bg} {...LINE} />
      <Building x={80} y={140} w={60} h={80} rows={3} cols={2} />
      <Building
        x={160}
        y={140}
        w={50}
        h={100}
        rows={4}
        cols={2}
        fill={C.gold}
      />
      <Building x={240} y={140} w={70} h={70} rows={2} cols={3} />
      <Building x={330} y={140} w={60} h={95} rows={3} cols={2} fill={C.wine} />
      <rect x={60} y={30} width={360} height={110} fill="none" {...LINE} />
      {[40, 190, 340].map((x, i) => (
        <g key={x}>
          <Seated
            x={x + 30}
            y={222}
            h={84}
            shirt={[C.green, C.wine, C.leaf][i]}
            pose={i === 1 ? "phone" : "forward"}
          />
          <Table x={x + 52} y={196} w={80} />
          <rect
            x={x + 72}
            y={166}
            width={40}
            height={28}
            rx={2}
            fill={C.soft}
            {...LINE}
          />
          <line x1={x + 92} y1={194} x2={x + 92} y2={198} {...LINE} />
        </g>
      ))}
    </>
  ),
  "cafe-friends": () => (
    <>
      <Room floor={250} />
      <Window x={40} y={40} w={120} h={90} />
      <Window x={320} y={40} w={120} h={90} />
      <Seated x={150} y={210} h={90} shirt={C.green} pose="forward" />
      <Seated x={330} y={210} h={90} shirt={C.wine} pose="phone" flip />
      <Person x={240} y={200} h={90} shirt={C.gold} pose="up" />
      <Table x={170} y={200} w={140} />
      <Cup x={190} y={186} />
      <Cup x={232} y={186} />
      <Cup x={276} y={186} />
    </>
  ),
  "home-kitchen": () => (
    <>
      <Room floor={250} />
      <Window x={190} y={40} w={100} h={80} />
      {/* Worktop, hob and pot */}
      <rect x={40} y={180} width={400} height={70} fill={C.green} {...LINE} />
      <rect x={60} y={170} width={120} height={10} fill={C.soft} {...LINE} />
      <path d="M85 170 v-26 h60 v26" fill={C.wine} {...LINE} />
      <line x1={115} y1={144} x2={140} y2={110} {...LINE} />
      <path
        d="M100 136 q5 -10 0 -18 M125 132 q5 -10 0 -18"
        fill="none"
        {...LINE}
        strokeWidth={2}
      />
      <Person x={110} y={250} h={120} shirt={C.gold} pose="hold" />
      {/* Chopping board with vegetables */}
      <rect
        x={300}
        y={166}
        width={90}
        height={12}
        rx={3}
        fill={C.gold}
        {...LINE}
      />
      <circle cx={318} cy={158} r={8} fill={C.red} {...LINE} strokeWidth={2} />
      <path
        d="M335 164 l26 -10 l4 6 z"
        fill={C.gold}
        {...LINE}
        strokeWidth={2}
      />
      <circle cx={375} cy={158} r={8} fill={C.leaf} {...LINE} strokeWidth={2} />
      <Person x={380} y={250} h={120} shirt={C.leaf} pose="forward" flip />
    </>
  ),
  "school-classroom": () => (
    <>
      <Room floor={250} />
      <rect x={40} y={40} width={200} height={110} fill={C.leaf} {...LINE} />
      <path d="M60 70 h90 M60 95 h130 M60 120 h70" {...LINE} stroke={C.paper} />
      <Person x={280} y={250} h={130} shirt={C.wine} pose="up" flip />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <Seated
            x={330 + i * 50}
            y={232}
            h={70}
            shirt={[C.green, C.gold, C.leaf][i]}
            pose={i === 1 ? "up" : "forward"}
            flip
          />
          <rect
            x={300 + i * 50}
            y={214}
            width={30}
            height={6}
            fill={C.gold}
            {...LINE}
          />
        </g>
      ))}
    </>
  ),
  "crowded-bus": () => (
    <>
      <rect width={480} height={320} fill={C.paper} />
      <line x1={20} y1={50} x2={460} y2={50} {...LINE} strokeWidth={4} />
      {[0, 1, 2, 3].map((i) => (
        <Window key={i} x={30 + i * 115} y={70} w={90} h={60} />
      ))}
      <rect y={260} width={480} height={60} fill={C.ground} />
      <line x1={0} y1={260} x2={480} y2={260} {...LINE} />
      {[60, 130, 200, 270, 340, 410].map((x, i) => (
        <g key={x}>
          <line x1={x + 18} y1={50} x2={x + 18} y2={72} {...LINE} />
          <Person
            x={x}
            y={260}
            h={150 - (i % 3) * 10}
            shirt={[C.green, C.wine, C.gold, C.leaf, C.red, C.soft][i]}
            pose={i === 2 ? "phone" : "up"}
            flip={i % 2 === 1}
          />
        </g>
      ))}
    </>
  ),
  "cycle-lane": () => (
    <>
      <Sky ground={200} />
      <Cloud x={300} y={40} />
      <Tree x={60} y={200} h={120} />
      <Tree x={200} y={200} h={100} />
      <Tree x={400} y={200} h={130} />
      {/* Road with cars, a kerb, then the cycle lane */}
      <rect y={200} width={480} height={50} fill={C.soft} />
      <rect
        x={50}
        y={208}
        width={70}
        height={26}
        rx={8}
        fill={C.wine}
        {...LINE}
      />
      <rect
        x={300}
        y={208}
        width={70}
        height={26}
        rx={8}
        fill={C.gold}
        {...LINE}
      />
      <line x1={0} y1={250} x2={480} y2={250} {...LINE} strokeWidth={4} />
      <rect y={252} width={480} height={68} fill={C.leaf} />
      <path
        d="M20 290 h40 M100 290 h40 M180 290 h40 M260 290 h40 M340 290 h40 M420 290 h40"
        stroke={C.paper}
        strokeWidth={3}
      />
      {[90, 260].map((x, i) => (
        <g key={x}>
          <Bike x={x} y={310} />
          <Seated
            x={x + 18}
            y={272}
            h={70}
            shirt={i ? C.green : C.gold}
            pose="forward"
          />
        </g>
      ))}
    </>
  ),
  "city-flat": () => (
    <>
      <Sky ground={290} />
      <Building x={40} y={290} w={80} h={150} rows={5} cols={2} fill={C.gold} />
      <Building x={360} y={290} w={90} h={170} rows={6} cols={2} />
      <Building
        x={150}
        y={290}
        w={180}
        h={270}
        rows={6}
        cols={3}
        fill={C.green}
      />
      {/* Balcony with plants and a person watering them */}
      <rect x={180} y={170} width={120} height={8} fill={C.paper} {...LINE} />
      <path d="M180 178 v24 h120 v-24" fill="none" {...LINE} />
      <rect
        x={196}
        y={152}
        width={18}
        height={18}
        fill={C.wine}
        {...LINE}
        strokeWidth={2}
      />
      <circle cx={205} cy={146} r={9} fill={C.leaf} {...LINE} strokeWidth={2} />
      <Person x={262} y={172} h={70} shirt={C.wine} pose="forward" flip />
      <path
        d="M220 150 l12 -6 l6 10 z"
        fill={C.soft}
        {...LINE}
        strokeWidth={2}
      />
    </>
  ),
  "country-cottage": () => (
    <>
      <Sky ground={230} />
      <path
        d="M0 230 Q120 140 240 210 T480 180 V230 H0 Z"
        fill={C.green}
        {...LINE}
      />
      <Sun x={70} y={60} />
      <rect x={250} y={150} width={140} height={90} fill={C.paper} {...LINE} />
      <polygon points="240,152 320,100 400,152" fill={C.wine} {...LINE} />
      <rect x={305} y={195} width={28} height={45} fill={C.gold} {...LINE} />
      <Window x={262} y={170} w={30} h={24} />
      <Window x={348} y={170} w={30} h={24} />
      <line x1={0} y1={240} x2={480} y2={240} {...LINE} />
      {/* Garden rows */}
      {[90, 125, 160].map((x) => (
        <circle
          key={x}
          cx={x}
          cy={262}
          r={10}
          fill={C.leaf}
          {...LINE}
          strokeWidth={2}
        />
      ))}
      <Person x={200} y={280} h={100} shirt={C.gold} pose="hold" flip />
      <line x1={180} y1={232} x2={168} y2={278} {...LINE} />
    </>
  ),
  "beach-holiday": () => (
    <>
      <rect width={480} height={320} fill={C.bg} />
      <Sun x={400} y={50} r={22} />
      <rect y={140} width={480} height={60} fill={C.green} />
      <path
        d="M0 150 q20 -6 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0"
        fill="none"
        {...LINE}
        strokeWidth={2}
      />
      <rect y={200} width={480} height={120} fill={C.gold} />
      <line x1={0} y1={200} x2={480} y2={200} {...LINE} />
      {[90, 250, 400].map((x, i) => (
        <g key={x}>
          <line x1={x} y1={270} x2={x} y2={180} {...LINE} />
          <path
            d={`M${x - 45} 182 a45 30 0 0 1 90 0 z`}
            fill={i === 1 ? C.wine : C.red}
            {...LINE}
          />
        </g>
      ))}
      {[
        [40, 280, C.wine],
        [150, 300, C.green],
        [300, 285, C.paper],
        [350, 305, C.leaf],
      ].map(([x, y, fill]) => (
        <g key={`${x}`}>
          <rect
            x={x as number}
            y={y as number}
            width={70}
            height={12}
            rx={3}
            fill={fill as string}
            {...LINE}
          />
          <circle
            cx={(x as number) + 10}
            cy={(y as number) - 4}
            r={8}
            fill={C.paper}
            {...LINE}
          />
          <rect
            x={(x as number) + 20}
            y={(y as number) - 8}
            width={42}
            height={10}
            rx={5}
            fill={C.soft}
            {...LINE}
          />
        </g>
      ))}
    </>
  ),
  "mountain-hike": () => (
    <>
      <Sky ground={260} />
      <Mountain x={-20} y={260} w={260} h={190} />
      <Mountain x={180} y={260} w={320} h={230} />
      <path
        d="M40 320 C140 290 220 300 300 260"
        fill="none"
        stroke={C.paper}
        strokeWidth={14}
        strokeLinecap="round"
      />
      {[150, 220].map((x, i) => (
        <g key={x}>
          <rect
            x={x - 30}
            y={180}
            width={20}
            height={34}
            rx={5}
            fill={i ? C.wine : C.gold}
            {...LINE}
          />
          <Person
            x={x}
            y={300 - i * 14}
            h={110}
            shirt={i ? C.green : C.leaf}
            pose="forward"
          />
        </g>
      ))}
    </>
  ),
  "online-shopping": () => (
    <>
      <Room floor={250} />
      <rect x={60} y={40} width={10} height={210} fill={C.soft} {...LINE} />
      <rect x={20} y={40} width={50} height={210} fill={C.gold} {...LINE} />
      <circle cx={58} cy={150} r={4} fill={C.ink} />
      <Box x={90} y={250} w={50} h={36} />
      <Box x={100} y={214} w={34} h={26} />
      <Box x={150} y={250} w={36} h={28} />
      {/* Sofa */}
      <rect
        x={230}
        y={150}
        width={220}
        height={60}
        rx={14}
        fill={C.wine}
        {...LINE}
      />
      <rect
        x={220}
        y={190}
        width={240}
        height={50}
        rx={12}
        fill={C.wine}
        {...LINE}
      />
      <Seated x={330} y={195} h={100} shirt={C.green} pose="forward" />
      <Laptop x={362} y={186} />
    </>
  ),
  "high-street": () => (
    <>
      <Sky ground={250} />
      {[
        [20, C.gold],
        [130, C.green],
        [240, C.wine],
        [350, C.leaf],
      ].map(([x, fill], i) => (
        <g key={i}>
          <rect
            x={x as number}
            y={70}
            width={110}
            height={180}
            fill={fill as string}
            {...LINE}
          />
          <rect
            x={(x as number) + 10}
            y={150}
            width={90}
            height={60}
            fill={C.bg}
            {...LINE}
          />
          <rect
            x={(x as number) + 10}
            y={86}
            width={90}
            height={22}
            fill={C.paper}
            {...LINE}
          />
          {i === 2 ? (
            <>
              <Cup x={(x as number) + 30} y={170} />
              <Cup x={(x as number) + 60} y={170} />
            </>
          ) : null}
        </g>
      ))}
      <Person x={90} y={300} h={120} shirt={C.wine} pose="hold" />
      <Bag x={112} y={232} fill={C.gold} />
      <Person x={250} y={295} h={115} shirt={C.gold} pose="hold" flip />
      <Bag x={218} y={228} fill={C.green} />
      <Person x={380} y={305} h={120} shirt={C.green} pose="hold" />
      <Bag x={402} y={236} fill={C.red} />
    </>
  ),
  "concert-crowd": () => (
    <>
      <rect width={480} height={320} fill={C.soft} />
      <circle cx={420} cy={40} r={14} fill={C.paper} {...LINE} />
      {/* Stage, lights and band */}
      <rect x={100} y={60} width={280} height={110} fill={C.wine} {...LINE} />
      {[130, 240, 350].map((x) => (
        <polygon
          key={x}
          points={`${x},60 ${x - 30},170 ${x + 30},170`}
          fill={C.gold}
          opacity={0.45}
        />
      ))}
      <Person x={180} y={170} h={70} shirt={C.green} pose="forward" />
      <Person x={240} y={170} h={74} shirt={C.gold} pose="up" />
      <Person x={300} y={170} h={70} shirt={C.leaf} pose="forward" flip />
      <rect x={100} y={170} width={280} height={14} fill={C.paper} {...LINE} />
      {/* Crowd seen from behind */}
      {[40, 100, 160, 220, 280, 340, 400, 450].map((x, i) => (
        <Person
          key={x}
          x={x}
          y={340}
          h={130 - (i % 3) * 8}
          shirt={[C.green, C.gold, C.wine, C.leaf][i % 4]}
          pose={i % 3 === 0 ? "up" : "down"}
          flip={i % 2 === 1}
        />
      ))}
    </>
  ),
  "reading-at-home": () => (
    <>
      <Room floor={250} />
      {/* Bookshelf */}
      <rect x={30} y={50} width={120} height={200} fill={C.gold} {...LINE} />
      {[100, 150, 200].map((y) => (
        <line key={y} x1={30} y1={y} x2={150} y2={y} {...LINE} />
      ))}
      {[0, 1, 2].map((row) =>
        [0, 1, 2, 3].map((i) => (
          <rect
            key={`${row}-${i}`}
            x={40 + i * 26}
            y={60 + row * 50}
            width={16}
            height={38}
            fill={[C.wine, C.green, C.leaf, C.paper][(i + row) % 4]}
            {...LINE}
            strokeWidth={1.5}
          />
        )),
      )}
      {/* Lamp */}
      <line x1={420} y1={250} x2={420} y2={110} {...LINE} />
      <path d="M395 110 h50 l-10 -34 h-30 z" fill={C.gold} {...LINE} />
      {/* Armchair and reader */}
      <rect
        x={210}
        y={140}
        width={150}
        height={110}
        rx={20}
        fill={C.green}
        {...LINE}
      />
      <rect
        x={200}
        y={190}
        width={30}
        height={60}
        rx={10}
        fill={C.green}
        {...LINE}
      />
      <rect
        x={340}
        y={190}
        width={30}
        height={60}
        rx={10}
        fill={C.green}
        {...LINE}
      />
      <Seated x={270} y={205} h={100} shirt={C.wine} pose="hold" />
      <Book x={284} y={180} fill={C.paper} />
      {/* Rug and cat */}
      <ellipse cx={240} cy={285} rx={150} ry={20} fill={C.wine} {...LINE} />
      <ellipse cx={180} cy={274} rx={22} ry={11} fill={C.soft} {...LINE} />
      <circle cx={160} cy={266} r={9} fill={C.soft} {...LINE} />
      <path
        d="M154 259 l2 -8 l5 6 M162 258 l4 -7 l3 8"
        fill={C.soft}
        {...LINE}
        strokeWidth={2}
      />
      <path d="M202 276 q16 2 14 -14" fill="none" {...LINE} />
    </>
  ),
};
