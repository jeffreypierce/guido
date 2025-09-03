export const Modes = new Map([
  [
    "I",
    {
      identity: {
        mode: 1,
        alias: "dorian",
        mood: "serious",
        family: "dorian",
        roman: "I",
        latin: "Authenticus Protus",
        glareanus: false,
      },
      structure: {
        root: 2,
        final: 2,
        tenor: 9,
        tenor_adjusted: 10,
        ambitus: {
          type: "authentic",
          lowest: 2,
          highest: 21,
          span: 19,
        },
        species: {
          fifth: [2, 7],
          fourth: [7, 11],
        },
        preferred_hexachords: ["naturale", "molle"],
      },
      cadences: {
        psalm_tone: {
          tenor: 9,
          mediant_cadence: [5, 4],
          final_cadence: [5, 4, 2],
        },
        cadential_formulas: [
          {
            name: "final_descent",
            notes: [5, 4, 2],
          },
          {
            name: "tenor_fall",
            notes: [9, 2],
          },
        ],
        intonation_formulas: [
          {
            name: "rise_from_final",
            notes: [2, 4, 6],
          },
          {
            name: "tenor_return",
            notes: [7, 9],
          },
        ],
        characteristic_gestures: [
          {
            type: "final_leap",
            notes: [2, 5],
          },
        ],
      },
      chant_profile: {
        melodic_profile: "falling",
        melismatic_tendency: "melismatic",
        melisma_points: [9, 2],
        syllable_emphasis: [9, 7],
      },
      mode: 1,
      modulations: {
        regular: [2, 9, 5, 7],
        conceded: [12, 4],
        absolute_initials: [2, 5, 7, 9, 14],
      },
    },
  ],
  [
    "II",
    {
      identity: {
        mode: 2,
        alias: "hypodorian",
        mood: "sad",
        family: "",
        roman: "II",
        latin: "Hypoprotus",
        glareanus: false,
      },
      structure: {
        root: 9,
        final: 2,
        tenor: 5,
        tenor_adjusted: 10,
        ambitus: {
          type: "plagal",
          lowest: 0,
          highest: 17,
          span: 17,
        },
        species: {
          fifth: [2, 7],
          fourth: [4, 7],
        },
        preferred_hexachords: ["molle", "naturale"],
      },
      cadences: {
        psalm_tone: {
          tenor: 5,
          mediant_cadence: [4, 2],
          final_cadence: [5, 4, 2],
        },
        cadential_formulas: [
          {
            name: "final_descent",
            notes: [5, 4, 2],
          },
          {
            name: "tenor_fall",
            notes: [5, 2],
          },
        ],
        intonation_formulas: [
          {
            name: "rise_from_final",
            notes: [2, 4, 6],
          },
          {
            name: "tenor_return",
            notes: [3, 5],
          },
        ],
        characteristic_gestures: [
          {
            type: "final_leap",
            notes: [2, 5],
          },
          {
            type: "plagal_descent",
            notes: [0, 2],
          },
        ],
      },
      chant_profile: {
        melodic_profile: "arch",
        melismatic_tendency: "neumatic",
        melisma_points: [5, 2],
        syllable_emphasis: [5, 7],
      },
      mode: 2,
      modulations: {
        regular: [2, 5, 7, 9],
        conceded: [0, 4],
        absolute_initials: [0, 2, 4, 5, 7, 9],
      },
    },
  ],
  [
    "III",
    {
      identity: {
        mode: 3,
        alias: "phrygian",
        mood: "mystic",
        family: "phrygian",
        roman: "III",
        latin: "Authenticus Deuterus",
        glareanus: false,
      },
      structure: {
        root: 4,
        final: 4,
        tenor: 0,
        tenor_adjusted: 11,
        ambitus: {
          type: "authentic",
          lowest: 4,
          highest: 16,
          span: 12,
        },
        species: {
          fifth: [4, 9],
          fourth: [9, 12],
        },
        preferred_hexachords: ["naturale"],
      },
      cadences: {
        psalm_tone: {
          tenor: 0,
          mediant_cadence: [7, 5],
          final_cadence: [7, 5, 4],
        },
        cadential_formulas: [
          {
            name: "final_descent",
            notes: [7, 6, 4],
          },
          {
            name: "tenor_fall",
            notes: [0, 4],
          },
        ],
        intonation_formulas: [
          {
            name: "rise_from_final",
            notes: [4, 6, 8],
          },
          {
            name: "tenor_return",
            notes: [10, 0],
          },
        ],
        characteristic_gestures: [
          {
            type: "final_leap",
            notes: [4, 7],
          },
        ],
      },
      chant_profile: {
        melodic_profile: "falling",
        melismatic_tendency: "melismatic",
        melisma_points: [0, 4],
        syllable_emphasis: [0, 9],
      },
      mode: 3,
      modulations: {
        regular: [4, 0, 7, 9],
        conceded: [5, 11],
        absolute_initials: [0, 2, 4, 7, 9],
      },
    },
  ],
  [
    "IV",
    {
      identity: {
        mode: 4,
        alias: "hypophrygian",
        mood: "harmonious",
        family: "",
        roman: "IV",
        latin: "Hypodeuterus",
        glareanus: false,
      },
      structure: {
        root: 11,
        final: 4,
        tenor: 9,
        tenor_adjusted: 10,
        ambitus: {
          type: "plagal",
          lowest: 2,
          highest: 21,
          span: 19,
        },
        species: {
          fifth: [4, 9],
          fourth: [9, 13],
        },
        preferred_hexachords: ["naturale", "molle"],
      },
      cadences: {
        psalm_tone: {
          tenor: 9,
          mediant_cadence: [7, 5],
          final_cadence: [7, 5, 4],
        },
        cadential_formulas: [
          {
            name: "final_descent",
            notes: [7, 6, 4],
          },
          {
            name: "tenor_fall",
            notes: [9, 4],
          },
        ],
        intonation_formulas: [
          {
            name: "rise_from_final",
            notes: [4, 6, 8],
          },
          {
            name: "tenor_return",
            notes: [7, 9],
          },
        ],
        characteristic_gestures: [
          {
            type: "final_leap",
            notes: [4, 7],
          },
          {
            type: "plagal_descent",
            notes: [2, 4],
          },
        ],
      },
      chant_profile: {
        melodic_profile: "arch",
        melismatic_tendency: "neumatic",
        melisma_points: [9, 4],
        syllable_emphasis: [9, 9],
      },
      mode: 4,
      modulations: {
        regular: [4, 9, 7, 0],
        conceded: [11],
        absolute_initials: [0, 4, 7, 9],
      },
    },
  ],
  [
    "V",
    {
      identity: {
        mode: 5,
        alias: "lydian",
        mood: "happy",
        family: "lydian",
        roman: "V",
        latin: "Authenticus Tritus",
        glareanus: false,
      },
      structure: {
        root: 5,
        final: 5,
        tenor: 0,
        tenor_adjusted: 0,
        ambitus: {
          type: "authentic",
          lowest: 5,
          highest: 17,
          span: 12,
        },
        species: {
          fifth: [5, 12],
          fourth: [0, 4],
        },
        preferred_hexachords: ["durum", "naturale"],
      },
      cadences: {
        psalm_tone: {
          tenor: 0,
          mediant_cadence: [7, 5],
          final_cadence: [10, 7, 5],
        },
        cadential_formulas: [
          {
            name: "final_descent",
            notes: [8, 7, 5],
          },
          {
            name: "tenor_fall",
            notes: [0, 5],
          },
        ],
        intonation_formulas: [
          {
            name: "rise_from_final",
            notes: [5, 7, 9],
          },
          {
            name: "tenor_return",
            notes: [10, 0],
          },
        ],
        characteristic_gestures: [],
      },
      chant_profile: {
        melodic_profile: "rising",
        melismatic_tendency: "melismatic",
        melisma_points: [0, 5],
        syllable_emphasis: [0, 10],
      },
      mode: 5,
      modulations: {
        regular: [5, 0, 7, 12],
        conceded: [9, 2],
        absolute_initials: [5, 7, 9, 0, 12],
      },
    },
  ],
  [
    "VI",
    {
      identity: {
        mode: 6,
        alias: "hypolydian",
        mood: "devout",
        family: "",
        roman: "VI",
        latin: "Hypotritus",
        glareanus: false,
      },
      structure: {
        root: 0,
        final: 5,
        tenor: 9,
        tenor_adjusted: 10,
        ambitus: {
          type: "plagal",
          lowest: 3,
          highest: 21,
          span: 18,
        },
        species: {
          fifth: [5, 12],
          fourth: [0, 4],
        },
        preferred_hexachords: ["molle", "naturale"],
      },
      cadences: {
        psalm_tone: {
          tenor: 9,
          mediant_cadence: [7, 5],
          final_cadence: [10, 7, 5],
        },
        cadential_formulas: [
          {
            name: "final_descent",
            notes: [8, 7, 5],
          },
          {
            name: "tenor_fall",
            notes: [9, 5],
          },
        ],
        intonation_formulas: [
          {
            name: "rise_from_final",
            notes: [5, 7, 9],
          },
          {
            name: "tenor_return",
            notes: [7, 9],
          },
        ],
        characteristic_gestures: [
          {
            type: "plagal_descent",
            notes: [3, 5],
          },
        ],
      },
      chant_profile: {
        melodic_profile: "arch",
        melismatic_tendency: "neumatic",
        melisma_points: [9, 5],
        syllable_emphasis: [9, 10],
      },
      mode: 6,
      modulations: {
        regular: [5, 9, 0, 7],
        conceded: [2, 12],
        absolute_initials: [0, 2, 4, 5, 7, 9],
      },
    },
  ],
  [
    "VII",
    {
      identity: {
        mode: 7,
        alias: "mixolydian",
        mood: "angelical",
        family: "mixolydian",
        roman: "VII",
        latin: "Authenticus Tetrardus",
        glareanus: false,
      },
      structure: {
        root: 7,
        final: 7,
        tenor: 2,
        tenor_adjusted: 2,
        ambitus: {
          type: "authentic",
          lowest: 7,
          highest: 19,
          span: 12,
        },
        species: {
          fifth: [7, 14],
          fourth: [2, 5],
        },
        preferred_hexachords: ["durum", "naturale"],
      },
      cadences: {
        psalm_tone: {
          tenor: 2,
          mediant_cadence: [9, 7],
          final_cadence: [2, 0, 7],
        },
        cadential_formulas: [
          {
            name: "final_descent",
            notes: [10, 9, 7],
          },
          {
            name: "tenor_fall",
            notes: [2, 7],
          },
        ],
        intonation_formulas: [
          {
            name: "rise_from_final",
            notes: [7, 9, 11],
          },
          {
            name: "tenor_return",
            notes: [0, 2],
          },
        ],
        characteristic_gestures: [],
      },
      chant_profile: {
        melodic_profile: "rising",
        melismatic_tendency: "melismatic",
        melisma_points: [2, 7],
        syllable_emphasis: [2, 0],
      },
      mode: 7,
      modulations: {
        regular: [7, 2, 9, 14],
        conceded: [5, 0],
        absolute_initials: [7, 9, 11, 2, 14],
      },
    },
  ],
  [
    "VIII",
    {
      identity: {
        mode: 8,
        alias: "hypomixolydian",
        mood: "perfect",
        family: "",
        roman: "VIII",
        latin: "Hypotetrardus",
        glareanus: false,
      },
      structure: {
        root: 2,
        final: 7,
        tenor: 0,
        tenor_adjusted: 0,
        ambitus: {
          type: "plagal",
          lowest: 5,
          highest: 19,
          span: 14,
        },
        species: {
          fifth: [7, 14],
          fourth: [0, 4],
        },
        preferred_hexachords: ["durum", "naturale"],
      },
      cadences: {
        psalm_tone: {
          tenor: 0,
          mediant_cadence: [9, 7],
          final_cadence: [2, 0, 7],
        },
        cadential_formulas: [
          {
            name: "final_descent",
            notes: [10, 9, 7],
          },
          {
            name: "tenor_fall",
            notes: [0, 7],
          },
        ],
        intonation_formulas: [
          {
            name: "rise_from_final",
            notes: [7, 9, 11],
          },
          {
            name: "tenor_return",
            notes: [10, 0],
          },
        ],
        characteristic_gestures: [
          {
            type: "plagal_descent",
            notes: [5, 7],
          },
        ],
      },
      chant_profile: {
        melodic_profile: "arch",
        melismatic_tendency: "neumatic",
        melisma_points: [0, 7],
        syllable_emphasis: [0, 0],
      },
      mode: 8,
      modulations: {
        regular: [7, 0, 9, 14],
        conceded: [2, 5],
        absolute_initials: [0, 2, 4, 7, 9, 12, 14],
      },
    },
  ],
  [
    "IX",
    {
      identity: {
        mode: 9,
        alias: "aeolian",
        mood: "penitential",
        family: "aeolian",
        roman: "IX",
        latin: "Authenticus Aeolius",
        glareanus: true,
      },
      structure: {
        root: 9,
        final: 9,
        tenor: 0,
        tenor_adjusted: 0,
        ambitus: {
          type: "authentic",
          lowest: 9,
          highest: 21,
          span: 12,
        },
        species: {
          fifth: [9, 14],
          fourth: [2, 5],
        },
        preferred_hexachords: ["naturale", "molle"],
      },
      cadences: {
        psalm_tone: {
          tenor: 0,
          mediant_cadence: [5, 4],
          final_cadence: [5, 4, 9],
        },
        cadential_formulas: [
          {
            name: "final_descent",
            notes: [12, 11, 9],
          },
          {
            name: "tenor_fall",
            notes: [0, 9],
          },
        ],
        intonation_formulas: [
          {
            name: "rise_from_final",
            notes: [9, 11, 1],
          },
          {
            name: "tenor_return",
            notes: [10, 0],
          },
        ],
        characteristic_gestures: [],
      },
      chant_profile: {
        melodic_profile: "falling",
        melismatic_tendency: "melismatic",
        melisma_points: [0, 9],
        syllable_emphasis: [0, 2],
      },
      mode: 9,
      modulations: {
        regular: [9, 4, 0, 2],
        conceded: [19, 11],
        absolute_initials: [19, 9, 0, 2, 4],
      },
    },
  ],
  [
    "X",
    {
      identity: {
        mode: 10,
        alias: "hypoaeolian",
        mood: "yearning",
        family: "",
        roman: "X",
        latin: "Hypoaeolius",
        glareanus: true,
      },
      structure: {
        root: 0,
        final: 9,
        tenor: 5,
        tenor_adjusted: 10,
        ambitus: {
          type: "plagal",
          lowest: 7,
          highest: 21,
          span: 14,
        },
        species: {
          fifth: [9, 14],
          fourth: [2, 5],
        },
        preferred_hexachords: ["naturale", "molle"],
      },
      cadences: {
        psalm_tone: {
          tenor: 5,
          mediant_cadence: [4, 2],
          final_cadence: [5, 4, 9],
        },
        cadential_formulas: [
          {
            name: "final_descent",
            notes: [12, 11, 9],
          },
          {
            name: "tenor_fall",
            notes: [5, 9],
          },
        ],
        intonation_formulas: [
          {
            name: "rise_from_final",
            notes: [9, 11, 1],
          },
          {
            name: "tenor_return",
            notes: [3, 5],
          },
        ],
        characteristic_gestures: [
          {
            type: "plagal_descent",
            notes: [7, 9],
          },
        ],
      },
      chant_profile: {
        melodic_profile: "arch",
        melismatic_tendency: "syllabic",
        melisma_points: [5, 9],
        syllable_emphasis: [5, 2],
      },
      mode: 10,
      modulations: {
        regular: [9, 0, 11, 4],
        conceded: [7, 2],
        absolute_initials: [4, 7, 9, 23, 12],
      },
    },
  ],
  [
    "XI",
    {
      identity: {
        mode: 11,
        alias: "ionian",
        mood: "joyful",
        family: "ionian",
        roman: "XI",
        latin: "Authenticus Locris",
        glareanus: true,
      },
      structure: {
        root: 0,
        final: 0,
        tenor: 7,
        tenor_adjusted: 7,
        ambitus: {
          type: "authentic",
          lowest: 0,
          highest: 19,
          span: 19,
        },
        species: {
          fifth: [0, 5],
          fourth: [5, 9],
        },
        preferred_hexachords: ["naturale"],
      },
      cadences: {
        psalm_tone: {
          tenor: 7,
          mediant_cadence: [2, 0],
          final_cadence: [4, 2, 0],
        },
        cadential_formulas: [
          {
            name: "final_descent",
            notes: [3, 2, 0],
          },
          {
            name: "tenor_fall",
            notes: [7, 0],
          },
        ],
        intonation_formulas: [
          {
            name: "rise_from_final",
            notes: [0, 2, 4],
          },
          {
            name: "tenor_return",
            notes: [5, 7],
          },
        ],
        characteristic_gestures: [],
      },
      chant_profile: {
        melodic_profile: "rising",
        melismatic_tendency: "melismatic",
        melisma_points: [7, 0],
        syllable_emphasis: [7, 5],
      },
      mode: 11,
      modulations: {
        regular: [11, 7, 2, 4],
        conceded: [5],
        absolute_initials: [11, 12, 14, 7],
      },
    },
  ],
  [
    "XII",
    {
      identity: {
        mode: 12,
        alias: "hypoionian",
        mood: "peaceful",
        family: "",
        roman: "XII",
        latin: "Hypolocris",
        glareanus: true,
      },
      structure: {
        root: 5,
        final: 0,
        tenor: 4,
        tenor_adjusted: 4,
        ambitus: {
          type: "plagal",
          lowest: 5,
          highest: 17,
          span: 12,
        },
        species: {
          fifth: [0, 5],
          fourth: [5, 9],
        },
        preferred_hexachords: ["naturale"],
      },
      cadences: {
        psalm_tone: {
          tenor: 4,
          mediant_cadence: [2, 0],
          final_cadence: [4, 2, 0],
        },
        cadential_formulas: [
          {
            name: "final_descent",
            notes: [3, 2, 0],
          },
          {
            name: "tenor_fall",
            notes: [4, 0],
          },
        ],
        intonation_formulas: [
          {
            name: "rise_from_final",
            notes: [0, 2, 4],
          },
          {
            name: "tenor_return",
            notes: [2, 4],
          },
        ],
        characteristic_gestures: [
          {
            type: "plagal_descent",
            notes: [10, 12],
          },
        ],
      },
      chant_profile: {
        melodic_profile: "arch",
        melismatic_tendency: "neumatic",
        melisma_points: [4, 0],
        syllable_emphasis: [4, 5],
      },
      mode: 12,
      modulations: {
        regular: [11, 4, 2, 7],
        conceded: [0],
        absolute_initials: [17, 7, 9, 11, 12, 14],
      },
    },
  ],
  [
    "XIII",
    {
      identity: {
        mode: 13,
        alias: "locrian",
        mood: "tragic",
        family: "locrian",
        roman: "XIII",
        latin: "Authenticus Ionius",
        glareanus: true,
      },
      structure: {
        root: 11,
        final: 11,
        tenor: 2,
        tenor_adjusted: 2,
        ambitus: {
          type: "authentic",
          lowest: 11,
          highest: 23,
          span: 12,
        },
        species: {
          fifth: [11, 16],
          fourth: [4, 7],
        },
        preferred_hexachords: ["naturale"],
      },
      cadences: {
        psalm_tone: {
          tenor: 2,
          mediant_cadence: [5, 2],
          final_cadence: [4, 2, 11],
        },
        cadential_formulas: [
          {
            name: "final_descent",
            notes: [14, 13, 11],
          },
          {
            name: "tenor_fall",
            notes: [2, 11],
          },
        ],
        intonation_formulas: [
          {
            name: "rise_from_final",
            notes: [11, 1, 3],
          },
          {
            name: "tenor_return",
            notes: [0, 2],
          },
        ],
        characteristic_gestures: [],
      },
      chant_profile: {
        melodic_profile: "rising",
        melismatic_tendency: "melismatic",
        melisma_points: [2, 11],
        syllable_emphasis: [2, 4],
      },
      mode: 13,
      modulations: {
        regular: [0, 7, 4, 2],
        conceded: [5, 9, 11],
        absolute_initials: [0, 17, 4, 7],
      },
    },
  ],
  [
    "XIV",
    {
      identity: {
        mode: 14,
        alias: "hypolocrian",
        mood: "ethereal",
        family: "",
        roman: "XIV",
        latin: "Hypoionius",
        glareanus: true,
      },
      structure: {
        root: 4,
        final: 11,
        tenor: 9,
        tenor_adjusted: 10,
        ambitus: {
          type: "plagal",
          lowest: 9,
          highest: 23,
          span: 14,
        },
        species: {
          fifth: [11, 16],
          fourth: [4, 7],
        },
        preferred_hexachords: ["naturale", "molle"],
      },
      cadences: {
        psalm_tone: {
          tenor: 9,
          mediant_cadence: [5, 2],
          final_cadence: [4, 2, 11],
        },
        cadential_formulas: [
          {
            name: "final_descent",
            notes: [14, 13, 11],
          },
          {
            name: "tenor_fall",
            notes: [9, 11],
          },
        ],
        intonation_formulas: [
          {
            name: "rise_from_final",
            notes: [11, 1, 3],
          },
          {
            name: "tenor_return",
            notes: [7, 9],
          },
        ],
        characteristic_gestures: [
          {
            type: "plagal_descent",
            notes: [9, 11],
          },
        ],
      },
      chant_profile: {
        melodic_profile: "arch",
        melismatic_tendency: "syllabic",
        melisma_points: [9, 11],
        syllable_emphasis: [9, 4],
      },
      mode: 14,
      modulations: {
        regular: [0, 4, 9, 7],
        conceded: [17, 5, 2],
        absolute_initials: [19, 9, 12, 17, 5],
      },
    },
  ],
]);

export default Modes;
