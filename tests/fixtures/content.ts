/**
 * One valid, original example per exam part, plus one of each lesson type.
 * Tests clone these and break them on purpose. Long texts are generated with
 * `words()` so the fixtures stay readable.
 */
import type { ExamPart } from "@/lib/exam/format";

const FILLER = [
  "the",
  "night",
  "train",
  "crossed",
  "quiet",
  "valleys",
  "before",
  "dawn",
];

export function words(count: number): string {
  return Array.from(
    { length: count },
    (_, i) => FILLER[i % FILLER.length],
  ).join(" ");
}

const answer = (b2: string, c: string) => ({
  b2: { segments: [{ role: "intro", text: b2 }] },
  c: {
    segments: [
      { role: "intro", text: c },
      { role: "conclusion", text: "That's why it matters to me." },
    ],
  },
});

const question = (prompt: string) => ({
  prompt,
  models: answer(
    "I think it is a good idea.",
    "On balance, I'd say it's well worth it.",
  ),
});

export const validExercises: Record<ExamPart, unknown> = {
  "core-grammar": {
    id: "cg-inversion-hardly-01",
    examPart: "core-grammar",
    cefrLevel: "C1",
    topic: "travel",
    difficulty: 4,
    register: "written",
    grammarPoint: "inversion",
    prompt: "Hardly ___ the platform when the train pulled away.",
    options: ["had we reached", "we had reached", "we reached"],
    answer: 0,
    explanation: {
      en: "After a negative adverbial such as hardly at the start of a clause, the auxiliary comes before the subject.",
      es: "Tras «hardly» al principio de la oración, el auxiliar va antes del sujeto.",
    },
    optionNotes: [
      { en: "Correct: inversion with the past perfect." },
      { en: "There is no inversion after an initial hardly." },
      { en: "No inversion, and hardly … when needs the past perfect." },
    ],
  },
  "core-vocabulary": {
    id: "cv-synonyms-work-01",
    examPart: "core-vocabulary",
    cefrLevel: "B2",
    topic: "work",
    difficulty: 3,
    vocabType: "synonym",
    instructions: "Choose the word that is closest in meaning.",
    options: ["hire", "resign", "postpone", "reward", "complain"],
    items: [
      {
        id: "cv-synonyms-work-01-a",
        prompt: "employ",
        answer: 0,
        explanation: { en: "To employ someone is to hire them." },
      },
      {
        id: "cv-synonyms-work-01-b",
        prompt: "quit",
        answer: 1,
        explanation: { en: "To quit a job is to resign." },
      },
      {
        id: "cv-synonyms-work-01-c",
        prompt: "delay",
        answer: 2,
        explanation: { en: "To delay something is to postpone it." },
      },
    ],
  },
  "reading-1": {
    id: "r1-flatmate-note-01",
    examPart: "reading-1",
    cefrLevel: "B1",
    topic: "city",
    difficulty: 2,
    context: "A note to a flatmate",
    items: [
      {
        prompt: "I've left the keys ___ the kitchen table.",
        options: ["on", "at", "in"],
        answer: 0,
        explanation: { en: "Things rest on a surface." },
      },
      {
        prompt: "Could you ___ the bins out tonight?",
        options: ["bring", "take", "carry"],
        answer: 1,
        explanation: { en: "We take the bins out." },
      },
      {
        prompt: "The landlord is coming ___ Thursday morning.",
        options: ["in", "at", "on"],
        answer: 2,
        explanation: { en: "We use on with days." },
      },
      {
        prompt: "There isn't ___ milk left, so please buy some.",
        options: ["any", "some", "no"],
        answer: 0,
        explanation: { en: "Any is used in negative sentences." },
      },
      {
        prompt: "I'll be back late, ___ don't wait for me for dinner.",
        options: ["because", "so", "although"],
        answer: 1,
        explanation: { en: "So introduces a result." },
      },
    ],
  },
  "reading-2": {
    id: "r2-community-garden-01",
    examPart: "reading-2",
    cefrLevel: "B2",
    topic: "environment",
    difficulty: 3,
    title: "A garden for everyone",
    sentences: [
      "Last spring our town decided to turn an old car park into a community garden.",
      "At first, many residents doubted that the idea would work.",
      "Their main concern was that nobody would have time to look after the plants.",
      "To answer this, the council asked each street to take responsibility for one bed.",
      "This simple system meant that the work was shared among dozens of families.",
      "Today the garden is one of the busiest public spaces in the area.",
    ],
    explanation: {
      en: "Each sentence picks up an idea from the one before it.",
    },
    cohesionHints: [
      { sentence: 2, phrase: "Their", refersTo: 1 },
      { sentence: 3, phrase: "this", refersTo: 2 },
      { sentence: 4, phrase: "This simple system", refersTo: 3 },
    ],
  },
  "reading-3": {
    id: "r3-primary-homework-01",
    examPart: "reading-3",
    cefrLevel: "B2",
    topic: "education",
    difficulty: 3,
    question: "Should children have homework at primary school?",
    people: [
      {
        name: "Aisha",
        text: "A little homework teaches children to organise their time. Ten minutes of reading every evening is more than enough.",
      },
      {
        name: "Tom",
        text: "Homework mostly measures how much help parents can give. Children from busy families are at a disadvantage.",
      },
      {
        name: "Marta",
        text: "As a teacher, I see that practice at home helps with maths in particular. However, it should never replace time for play.",
      },
      {
        name: "Daniel",
        text: "My son is exhausted after school. Evenings should be for family, sport and rest.",
      },
    ],
    statements: [
      {
        text: "Short daily reading is a reasonable amount.",
        answer: 0,
        explanation: { en: "Aisha says ten minutes is enough." },
      },
      {
        text: "Homework can be unfair to some pupils.",
        answer: 1,
        explanation: { en: "Tom mentions children from busy families." },
      },
      {
        text: "Some subjects benefit more than others.",
        answer: 2,
        explanation: { en: "Marta mentions maths in particular." },
      },
      {
        text: "Children are too tired to do extra work.",
        answer: 3,
        explanation: { en: "Daniel says his son is exhausted." },
      },
      {
        text: "Homework can help children manage their time.",
        answer: 0,
        explanation: { en: "Aisha talks about organising time." },
      },
      {
        text: "Playing is just as important as studying.",
        answer: 2,
        explanation: { en: "Marta says homework should not replace play." },
      },
      {
        text: "The home situation affects results.",
        answer: 1,
        explanation: { en: "Tom links homework to parental help." },
      },
    ],
  },
  "reading-4": {
    id: "r4-night-trains-01",
    examPart: "reading-4",
    cefrLevel: "C1",
    topic: "travel",
    difficulty: 4,
    title: "The return of the night train",
    paragraphs: Array.from({ length: 7 }, () => words(107)),
    headings: [
      "A forgotten way to travel",
      "Why airlines are worried",
      "The cost of a good night's sleep",
      "Governments step in",
      "Not everyone is convinced",
      "Designing the modern sleeper",
      "What the future holds",
      "A record year for ferries",
    ],
    answers: [0, 2, 1, 3, 5, 4, 6],
    explanations: Array.from({ length: 7 }, () => ({
      en: "The heading sums up the paragraph.",
    })),
  },
  "listening-1": {
    id: "l1-dentist-message-01",
    examPart: "listening-1",
    cefrLevel: "B1",
    topic: "health-sport",
    difficulty: 2,
    context: "A phone message from a dental practice",
    script: [
      {
        speaker: "woman",
        text: "Hello, this is Sarah from Park Lane Dental. I'm calling to move your appointment from Tuesday to Thursday at ten past four. Please ring us back if that time doesn't suit you.",
      },
    ],
    question: "When is the new appointment?",
    options: ["Tuesday at 4.10", "Thursday at 4.10", "Thursday at 10.40"],
    answer: 1,
    explanation: { en: "She moves it to Thursday at ten past four." },
  },
  "listening-2": {
    id: "l2-new-skills-01",
    examPart: "listening-2",
    cefrLevel: "B2",
    topic: "culture-leisure",
    difficulty: 3,
    question:
      "Four people talk about learning a new skill. What does each person say?",
    options: [
      "It cost more than expected.",
      "A friend persuaded them to start.",
      "They learnt it online.",
      "It helped them at work.",
      "They nearly gave up.",
      "They now teach it to others.",
    ],
    speakers: [
      {
        script: [
          {
            speaker: "woman",
            text: "I'd never have tried pottery if my neighbour hadn't dragged me along to her class.",
          },
        ],
        answer: 1,
      },
      {
        script: [
          {
            speaker: "man",
            text: "The first month of guitar was so frustrating that I almost sold it.",
          },
        ],
        answer: 4,
      },
      {
        script: [
          {
            speaker: "woman",
            text: "Learning to code meant I could finally automate the boring reports at the office.",
          },
        ],
        answer: 3,
      },
      {
        script: [
          {
            speaker: "man",
            text: "These days I run a small salsa group for beginners on Fridays.",
          },
        ],
        answer: 5,
      },
    ],
    explanation: { en: "Listen for the idea, not the exact words." },
  },
  "listening-3": {
    id: "l3-working-from-home-01",
    examPart: "listening-3",
    cefrLevel: "B2",
    topic: "work",
    difficulty: 3,
    question: "A man and a woman are discussing working from home.",
    script: [
      {
        speaker: "man",
        text: "I get far more done at home. No one interrupts me.",
      },
      {
        speaker: "woman",
        text: "Maybe, but I really miss chatting to colleagues.",
      },
      {
        speaker: "man",
        text: "True, the office is better for meeting people.",
      },
      {
        speaker: "woman",
        text: "And my kitchen table is terrible for my back!",
      },
    ],
    statements: [
      {
        text: "Working from home is more productive.",
        answer: "man",
        explanation: { en: "Only the man says this." },
      },
      {
        text: "Contact with colleagues is important.",
        answer: "woman",
        explanation: { en: "She misses chatting to colleagues." },
      },
      {
        text: "The office is good for social contact.",
        answer: "both",
        explanation: { en: "He agrees with her point." },
      },
      {
        text: "Home furniture can cause problems.",
        answer: "woman",
        explanation: { en: "She mentions her back." },
      },
    ],
  },
  "listening-4": {
    id: "l4-museum-review-01",
    examPart: "listening-4",
    cefrLevel: "C1",
    topic: "culture-leisure",
    difficulty: 4,
    script: [
      {
        speaker: "man",
        text: "I was asked to review the new museum, and honestly, I went in expecting very little. The building itself is impressive, I'll give them that. But the exhibitions felt rushed, as if someone had simply emptied a storeroom onto the walls. Still, the café was lovely, so it wasn't a complete waste of an afternoon.",
      },
    ],
    questions: [
      {
        prompt: "What is the speaker's overall attitude to the museum?",
        options: ["Enthusiastic", "Disappointed", "Indifferent"],
        answer: 1,
        explanation: {
          en: "His praise is limited and his criticism is strong.",
        },
        cues: [
          "expecting very little",
          "felt rushed",
          "wasn't a complete waste",
        ],
      },
      {
        prompt: "Why does the speaker mention the café?",
        options: [
          "To recommend the museum",
          "To soften his criticism",
          "To complain about prices",
        ],
        answer: 1,
        explanation: {
          en: "Still introduces a small positive point after the criticism.",
        },
        cues: ["Still,", "wasn't a complete waste of an afternoon"],
      },
    ],
  },
  "writing-1": {
    id: "w1-cycling-club-01",
    examPart: "writing-1",
    cefrLevel: "A2",
    topic: "health-sport",
    difficulty: 1,
    context: "You have joined a cycling club.",
    messages: [
      {
        prompt: "What kind of bike do you have?",
        sampleAnswers: ["A mountain bike"],
      },
      { prompt: "When do you usually ride?", sampleAnswers: ["At weekends"] },
      {
        prompt: "Where do you like cycling?",
        sampleAnswers: ["In the countryside"],
      },
      { prompt: "Who do you ride with?", sampleAnswers: ["My brother"] },
      { prompt: "What is your favourite snack?", sampleAnswers: ["Bananas"] },
    ],
  },
  "writing-2": {
    id: "w2-photography-club-01",
    examPart: "writing-2",
    cefrLevel: "B2",
    topic: "culture-leisure",
    difficulty: 2,
    context: "You are a new member of a photography club.",
    prompt:
      "Tell us why you joined the club and what you hope to learn. Write 20–30 words.",
    models: {
      b2: {
        text: "I joined because I love taking photos when I travel. I hope to learn how to use my camera properly and edit pictures better.",
        annotations: [
          {
            quote: "because",
            kind: "connector",
            note: { en: "A simple connector of reason." },
          },
        ],
      },
      c: {
        text: "Having recently started travelling more, I'd love to capture places more creatively. Above all, I'm hoping to master manual settings and develop a more distinctive style.",
        annotations: [
          {
            quote: "Having recently started",
            kind: "advanced-structure",
            note: { en: "A participle clause instead of a because clause." },
          },
          {
            quote: "Above all",
            kind: "connector",
            note: { en: "Signals the most important point." },
          },
        ],
      },
    },
  },
  "writing-3": {
    id: "w3-cooking-club-01",
    examPart: "writing-3",
    cefrLevel: "B2",
    topic: "culture-leisure",
    difficulty: 3,
    context:
      "You are a member of a cooking club. Answer the questions from other members in an online chat.",
    questions: [
      {
        prompt: "What was the best meal you have ever eaten? Why?",
        models: {
          b2: {
            text: "The best meal I have ever eaten was a seafood paella in Valencia. It was special because my whole family was there, and the rice was cooked over a wood fire by the beach.",
            annotations: [],
          },
          c: {
            text: "Without a doubt, it was a seafood paella I had in Valencia last summer. What made it unforgettable was not only the flavour but also the setting: a wood fire, the sea and my entire family.",
            annotations: [
              {
                quote: "What made it unforgettable was",
                kind: "advanced-structure",
                note: { en: "A cleft sentence for emphasis." },
              },
            ],
          },
        },
      },
      {
        prompt: "Do you prefer cooking at home or eating out?",
        models: {
          b2: {
            text: "I prefer cooking at home because it is cheaper and healthier. I also enjoy trying new recipes at the weekend. However, I sometimes eat out with friends when we want to celebrate something.",
            annotations: [],
          },
          c: {
            text: "On the whole, I'd rather cook at home, since I know exactly what goes into my food. That said, eating out now and then is a great way to discover dishes I would never attempt myself.",
            annotations: [
              {
                quote: "That said",
                kind: "connector",
                note: { en: "Introduces a contrasting point." },
              },
            ],
          },
        },
      },
      {
        prompt: "What dish would you like to learn to cook, and why?",
        models: {
          b2: {
            text: "I would like to learn to cook Indian curry. I love the spices, but when I try to make it at home, it never tastes like the curry in my favourite restaurant.",
            annotations: [],
          },
          c: {
            text: "I'd love to master a proper Indian curry. Every attempt I've made so far has turned out rather bland, so I'm keen to understand how to balance the spices the way good restaurants do.",
            annotations: [],
          },
        },
      },
    ],
  },
  "writing-4": {
    id: "w4-gym-hours-01",
    examPart: "writing-4",
    cefrLevel: "C1",
    topic: "health-sport",
    difficulty: 4,
    context:
      "You are a member of a fitness club. You received this email from the club manager.",
    situation:
      "From next month, the club will close at 8 pm instead of 10 pm on weekdays to reduce costs.",
    informal: {
      prompt:
        "Write an email to a friend who is also a member. Tell them about the change and how you feel about it. Write 40–50 words.",
      models: {
        b2: {
          text: "Hi Jess, have you heard? From next month the gym will close at eight on weekdays instead of ten. I'm really annoyed because I can only train after work. Maybe we could go together on Saturday mornings instead? Let me know! Lucy",
          annotations: [],
        },
        c: {
          text: "Hi Jess, guess what? The gym's going to shut at eight on weekdays from next month. Talk about bad timing! I can barely make it there before seven as it is. Fancy switching to early-morning sessions with me? We could keep each other motivated. Lucy",
          annotations: [
            {
              quote: "Talk about bad timing!",
              kind: "register",
              note: { en: "An informal exclamation." },
            },
          ],
        },
      },
    },
    formal: {
      prompt:
        "Write an email to the club manager. Explain how the change affects you and suggest a solution. Write 120–150 words.",
      recipient: "The club manager",
      models: {
        b2: {
          text: "Dear Sir or Madam,\n\nI am writing about the new weekday closing time of eight in the evening, which was announced in your recent email.\n\nI have been a member of the club for three years and I usually train between seven and nine, because I finish work at half past six. If the club closes earlier, I will only be able to come at weekends, which is not enough for me. I am sure that many other members who work full time are in the same situation.\n\nI understand that the club needs to reduce costs. However, I would like to suggest closing later on two or three evenings a week, or opening later in the morning, when fewer people use the facilities.\n\nI hope you will consider my suggestion.\n\nYours faithfully,\nLucy Martín",
          annotations: [
            {
              quote: "I am writing about",
              kind: "register",
              note: { en: "A standard formal opening." },
            },
          ],
        },
        c: {
          text: "Dear Mr Hughes,\n\nI am writing in response to your recent announcement that the club will close at eight o'clock on weekdays from next month.\n\nWhile I appreciate the need to keep costs under control, I am concerned that this decision will affect a large number of members. Like many others, I work until six and rely on the late sessions; under the new timetable, I would be unable to attend on weekdays at all.\n\nRather than reducing opening hours across the board, might it be possible to keep the club open until ten on selected evenings? Alternatively, a slightly higher fee for off-peak access could offset the extra costs without excluding working members.\n\nI would be grateful if you could take these suggestions into account before the change comes into effect.\n\nYours sincerely,\nLucy Martín",
          annotations: [
            {
              quote: "might it be possible",
              kind: "register",
              note: { en: "A polite, indirect suggestion." },
            },
          ],
        },
      },
    },
  },
  "speaking-1": {
    id: "s1-free-time-01",
    examPart: "speaking-1",
    cefrLevel: "B1",
    topic: "culture-leisure",
    difficulty: 1,
    questions: [
      question("What do you like doing at the weekend?"),
      question("Tell me about your hometown."),
      question("What kind of music do you enjoy?"),
    ],
  },
  "speaking-2": {
    id: "s2-street-market-01",
    examPart: "speaking-2",
    cefrLevel: "B2",
    topic: "shopping-consumption",
    difficulty: 2,
    image: {
      sceneId: "street-market",
      alt: { en: "People buying fruit at an outdoor market stall." },
    },
    questions: [
      question("Describe this picture."),
      question("Do you prefer shopping at markets or supermarkets?"),
      question("How has the way people shop changed in your country?"),
    ],
  },
  "speaking-3": {
    id: "s3-commuting-01",
    examPart: "speaking-3",
    cefrLevel: "B2",
    topic: "city",
    difficulty: 3,
    images: [
      {
        sceneId: "crowded-bus",
        alt: { en: "Commuters standing on a crowded bus." },
      },
      {
        sceneId: "cycle-lane",
        alt: { en: "People cycling to work along a cycle lane." },
      },
    ],
    questions: [
      question("Tell me what you see in the two pictures."),
      question("Which way of getting to work would you prefer, and why?"),
      question(
        "How might cities encourage people to leave their cars at home?",
      ),
    ],
  },
  "speaking-4": {
    id: "s4-technology-01",
    examPart: "speaking-4",
    cefrLevel: "C1",
    topic: "technology",
    difficulty: 4,
    image: {
      sceneId: "family-screens",
      alt: { en: "A family at dinner, each person looking at a phone." },
    },
    questions: [
      question("Tell me about a time when technology made your life easier."),
      question("How did you feel about it?"),
      question(
        "Do you think technology brings people closer together or drives them apart?",
      ),
    ],
  },
};

export const validLessons = {
  grammar: {
    slug: "inversion",
    level: "C1",
    title: {
      en: "Inversion after negative adverbials",
      es: "Inversión tras adverbios negativos",
    },
    summary: {
      en: "Put the auxiliary before the subject to add emphasis in formal English.",
    },
    form: ["Negative adverbial + auxiliary + subject + main verb"],
    uses: [
      {
        text: "To emphasise how surprising or unusual something was.",
        note: { en: "Typical of formal writing." },
      },
    ],
    mistakes: [
      {
        wrong: "Never I have seen such a mess.",
        right: "Never have I seen such a mess.",
        why: {
          en: "The auxiliary must come before the subject.",
          es: "El auxiliar va antes del sujeto.",
        },
      },
    ],
    examples: [
      { en: "Never have I seen such a crowded beach." },
      { en: "Not only did she win, but she also broke the record." },
      { en: "Hardly had we sat down when the lights went out." },
      { en: "Rarely do we get such clear skies in November." },
      { en: "Under no circumstances should you open that door." },
      { en: "Little did they know what was about to happen." },
      { en: "No sooner had I left than it started to rain." },
      {
        en: "Only then did I realise my mistake.",
        es: "Solo entonces me di cuenta de mi error.",
      },
    ],
    practice: [
      {
        prompt: "Never ___ such a beautiful view.",
        options: ["have I seen", "I have seen", "I saw"],
        answer: 0,
        explanation: { en: "Inversion after never." },
      },
      {
        prompt: "Not only ___ late, but he also forgot the tickets.",
        options: ["he was", "was he", "he is"],
        answer: 1,
        explanation: { en: "Inversion after not only." },
      },
      {
        prompt: "Rarely ___ so much rain in one day.",
        options: ["we get", "we got", "do we get"],
        answer: 2,
        explanation: { en: "Inversion with do after rarely." },
      },
    ],
    canDo: ["c1-writing-emphasis"],
  },
  vocabulary: {
    id: "eventually",
    headword: "eventually",
    pos: "adverb",
    level: "B2",
    topics: ["general"],
    definition: "In the end, especially after a long time or a lot of effort.",
    examples: ["After three hours of waiting, the bus eventually arrived."],
    register: "neutral",
    falseFriend: {
      spanish: "eventualmente",
      trap: {
        en: "It does not mean possibly or occasionally.",
        es: "No significa «posiblemente» ni «de vez en cuando».",
      },
    },
  },
  canDo: {
    id: "c1-writing-emphasis",
    level: "C1",
    skill: "writing",
    text: {
      en: "I can use inversion and other structures to add emphasis in formal writing.",
    },
    links: { lessons: ["inversion"], parts: ["writing-4", "core-grammar"] },
  },
  functional: {
    id: "hedging-it-could-be-argued",
    function: "hedging",
    register: "formal",
    phrase: "It could be argued that…",
    example: "It could be argued that the new timetable benefits most members.",
  },
};
