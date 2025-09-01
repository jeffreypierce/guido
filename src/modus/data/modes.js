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
        tenor_adjusted: {
          pc: 10,
          reason: "tritone_avoidance",
          due_to_mutation: true,
        },
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
        steps: [2, 1, 2, 2, 2, 1, 2],
        mutation_contexts: [
          {
            substitutions: [[11, 10]],
            hexachord: "molle",
            when: {
              melodic_direction: "descending",
              proximity: "cadence",
            },
          },
        ],
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
            role: "to_final",
          },
          {
            name: "tenor_fall",
            notes: [9, 2],
            role: "tenor_to_final",
          },
        ],
        intonation_formulas: [
          {
            name: "rise_from_final",
            notes: [2, 4, 6],
            role: "to_tenor_setup",
          },
          {
            name: "tenor_return",
            notes: [7, 9],
            role: "to_tenor",
          },
        ],
        characteristic_gestures: [
          {
            type: "final_leap",
            notes: [2, 5],
            role: "final_departure",
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
]);

export default Modes;
