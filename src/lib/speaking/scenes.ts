/**
 * The original SVG scenes Speaking tasks can show, with what each one depicts. Content refers
 * to them by id; the drawings live in `src/components/speaking/scenes/`.
 */
export const SCENES = {
  "street-market":
    "An outdoor market stall under an awning, piled with fruit and vegetables; a seller hands a bag to two customers.",
  "family-picnic":
    "A family of four on a picnic blanket in a park: two adults with a basket and food, a child with a ball, a tree behind them.",
  "open-plan-office":
    "An open-plan office: three people at desks with computers, one talking on the phone, a large window with city buildings.",
  "cafe-friends":
    "Three friends at a café table with cups of coffee, two chatting and laughing, one looking at a phone.",
  "home-kitchen":
    "Two people cooking together in a home kitchen: one stirring a pot on the hob, the other chopping vegetables.",
  "school-classroom":
    "A classroom: a teacher at a whiteboard and pupils at desks, one pupil raising a hand.",
  "crowded-bus":
    "Commuters standing close together on a crowded bus, holding the rails; one reads a phone.",
  "cycle-lane":
    "People cycling to work along a separate cycle lane beside a road with cars and trees.",
  "city-flat":
    "A tall block of flats in a city with balconies; a person waters plants on one balcony.",
  "country-cottage":
    "A small cottage in the countryside with a garden and hills behind; a person is working in the garden.",
  "beach-holiday":
    "A busy beach in summer: umbrellas, people sunbathing on towels, the sea and the sun.",
  "mountain-hike":
    "Two hikers with backpacks walking up a mountain path, with snowy peaks behind them.",
  "online-shopping":
    "A person on a sofa ordering something on a laptop, with several delivery boxes by the door.",
  "high-street":
    "Shoppers with bags walking along a high street past shop fronts and a café.",
  "concert-crowd":
    "A crowd at an outdoor concert in the evening, facing a lit stage with a band; some raise their hands.",
  "reading-at-home":
    "A person reading a book in an armchair beside a lamp and a bookshelf, with a cat on the rug.",
} as const;

export type SceneId = keyof typeof SCENES;
export const SCENE_IDS = Object.keys(SCENES) as [SceneId, ...SceneId[]];
