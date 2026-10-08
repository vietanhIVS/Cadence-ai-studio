import type {CycleDay,Exercise} from '../cadence';

// Imported from CADENCE_USER_PPL_PRESET_NORMALIZED.md. No target loads were supplied.
export const userPplExercises:Exercise[]=[
  {
    "id": "user-ppl:incline-barbell-dumbbell-press",
    "name": "Incline Barbell / Dumbbell Press",
    "muscle": "Chest",
    "equipment": "Barbell / Dumbbell",
    "source": "SYSTEM"
  },
  {
    "id": "user-ppl:seated-fly-may",
    "name": "Seated Fly máy",
    "muscle": "Chest",
    "equipment": "Machine",
    "source": "SYSTEM"
  },
  {
    "id": "user-ppl:decline-press-flat-press",
    "name": "Decline Press / Flat Press",
    "muscle": "Chest",
    "equipment": "",
    "source": "SYSTEM"
  },
  {
    "id": "user-ppl:cable-crossover-low-to-high",
    "name": "Cable Crossover low-to-high",
    "muscle": "Chest",
    "equipment": "Cable",
    "source": "SYSTEM"
  },
  {
    "id": "user-ppl:cable-lateral-raise",
    "name": "Cable Lateral Raise",
    "muscle": "Shoulders",
    "equipment": "Cable",
    "source": "SYSTEM"
  },
  {
    "id": "user-ppl:leaning-cable-lateral-raise",
    "name": "Leaning Cable Lateral Raise",
    "muscle": "Shoulders",
    "equipment": "Cable",
    "source": "SYSTEM"
  },
  {
    "id": "user-ppl:overhead-tricep-extension",
    "name": "Overhead Tricep Extension",
    "muscle": "Arms",
    "equipment": "",
    "source": "SYSTEM"
  },
  {
    "id": "user-ppl:weighted-pull-ups",
    "name": "Weighted Pull-ups",
    "muscle": "Back",
    "equipment": "",
    "source": "SYSTEM"
  },
  {
    "id": "user-ppl:one-arm-dumbbell-row",
    "name": "One-Arm Dumbbell Row",
    "muscle": "Back",
    "equipment": "Dumbbell",
    "source": "SYSTEM"
  },
  {
    "id": "user-ppl:neutral-lat-pulldown",
    "name": "Neutral Lat Pulldown",
    "muscle": "Back",
    "equipment": "Cable",
    "source": "SYSTEM"
  },
  {
    "id": "user-ppl:incline-db-rear-delt-fly",
    "name": "Incline DB Rear Delt Fly",
    "muscle": "Shoulders",
    "equipment": "Dumbbell",
    "source": "SYSTEM"
  },
  {
    "id": "user-ppl:dumbbell-shrug",
    "name": "Dumbbell Shrug",
    "muscle": "Back",
    "equipment": "Dumbbell",
    "source": "SYSTEM"
  },
  {
    "id": "user-ppl:incline-db-curl",
    "name": "Incline DB Curl",
    "muscle": "Arms",
    "equipment": "Dumbbell",
    "source": "SYSTEM"
  },
  {
    "id": "user-ppl:hammer-curl",
    "name": "Hammer Curl",
    "muscle": "Arms",
    "equipment": "Machine",
    "source": "SYSTEM"
  },
  {
    "id": "user-ppl:dumbbell-reverse-curl",
    "name": "Dumbbell Reverse Curl",
    "muscle": "Arms",
    "equipment": "Dumbbell",
    "source": "SYSTEM"
  },
  {
    "id": "user-ppl:squat",
    "name": "Squat",
    "muscle": "Legs",
    "equipment": "",
    "source": "SYSTEM"
  },
  {
    "id": "user-ppl:hamstring-curl",
    "name": "Hamstring Curl",
    "muscle": "Legs",
    "equipment": "Machine",
    "source": "SYSTEM"
  },
  {
    "id": "user-ppl:leg-extension",
    "name": "Leg Extension",
    "muscle": "Legs",
    "equipment": "Machine",
    "source": "SYSTEM"
  },
  {
    "id": "user-ppl:inner-outer-thigh",
    "name": "Inner/Outer Thigh",
    "muscle": "Legs",
    "equipment": "Machine",
    "source": "SYSTEM"
  }
];

// Workout templates only. The repeating cycle is configured separately.
export const userPplWorkouts:CycleDay[]=[
  {
    "type": "WORKOUT",
    "name": "Push",
    "exercises": [
      {
        "id": "preset-user-ppl:push:incline-barbell-dumbbell-press",
        "exerciseId": "user-ppl:incline-barbell-dumbbell-press",
        "name": "Incline Barbell / Dumbbell Press",
        "order": 1,
        "sets": [
          {
            "id": "preset-user-ppl:push:incline-barbell-dumbbell-press:set:1",
            "setNumber": 1,
            "repMin": 15,
            "repMax": 15,
            "restSeconds": 60
          },
          {
            "id": "preset-user-ppl:push:incline-barbell-dumbbell-press:set:2",
            "setNumber": 2,
            "repMin": 12,
            "repMax": 12,
            "restSeconds": 60
          },
          {
            "id": "preset-user-ppl:push:incline-barbell-dumbbell-press:set:3",
            "setNumber": 3,
            "repMin": 10,
            "repMax": 10,
            "restSeconds": 90
          },
          {
            "id": "preset-user-ppl:push:incline-barbell-dumbbell-press:set:4",
            "setNumber": 4,
            "repMin": 8,
            "repMax": 10,
            "restSeconds": 90
          }
        ]
      },
      {
        "id": "preset-user-ppl:push:seated-fly-may",
        "exerciseId": "user-ppl:seated-fly-may",
        "name": "Seated Fly máy",
        "order": 2,
        "sets": [
          {
            "id": "preset-user-ppl:push:seated-fly-may:set:1",
            "setNumber": 1,
            "repMin": 15,
            "repMax": 15,
            "restSeconds": 60
          },
          {
            "id": "preset-user-ppl:push:seated-fly-may:set:2",
            "setNumber": 2,
            "repMin": 12,
            "repMax": 12,
            "restSeconds": 60
          },
          {
            "id": "preset-user-ppl:push:seated-fly-may:set:3",
            "setNumber": 3,
            "repMin": 12,
            "repMax": 12,
            "restSeconds": 60
          }
        ],
        "notes": "Ngồi chéo ~20–30°"
      },
      {
        "id": "preset-user-ppl:push:decline-press-flat-press",
        "exerciseId": "user-ppl:decline-press-flat-press",
        "name": "Decline Press / Flat Press",
        "order": 3,
        "sets": [
          {
            "id": "preset-user-ppl:push:decline-press-flat-press:set:1",
            "setNumber": 1,
            "repMin": 15,
            "repMax": 15,
            "restSeconds": 60
          },
          {
            "id": "preset-user-ppl:push:decline-press-flat-press:set:2",
            "setNumber": 2,
            "repMin": 12,
            "repMax": 12,
            "restSeconds": 60
          },
          {
            "id": "preset-user-ppl:push:decline-press-flat-press:set:3",
            "setNumber": 3,
            "repMin": 10,
            "repMax": 10,
            "restSeconds": 90
          },
          {
            "id": "preset-user-ppl:push:decline-press-flat-press:set:4",
            "setNumber": 4,
            "repMin": 8,
            "repMax": 10,
            "restSeconds": 90
          }
        ]
      },
      {
        "id": "preset-user-ppl:push:cable-crossover-low-to-high",
        "exerciseId": "user-ppl:cable-crossover-low-to-high",
        "name": "Cable Crossover low-to-high",
        "order": 4,
        "sets": [
          {
            "id": "preset-user-ppl:push:cable-crossover-low-to-high:set:1",
            "setNumber": 1,
            "repMin": 15,
            "repMax": 15,
            "restSeconds": 45
          },
          {
            "id": "preset-user-ppl:push:cable-crossover-low-to-high:set:2",
            "setNumber": 2,
            "repMin": 12,
            "repMax": 15,
            "restSeconds": 60
          },
          {
            "id": "preset-user-ppl:push:cable-crossover-low-to-high:set:3",
            "setNumber": 3,
            "repMin": 12,
            "repMax": 15,
            "restSeconds": 60
          }
        ]
      },
      {
        "id": "preset-user-ppl:push:cable-lateral-raise",
        "exerciseId": "user-ppl:cable-lateral-raise",
        "name": "Cable Lateral Raise",
        "order": 5,
        "sets": [
          {
            "id": "preset-user-ppl:push:cable-lateral-raise:set:1",
            "setNumber": 1,
            "repMin": 20,
            "repMax": 20,
            "restSeconds": 45
          },
          {
            "id": "preset-user-ppl:push:cable-lateral-raise:set:2",
            "setNumber": 2,
            "repMin": 18,
            "repMax": 18,
            "restSeconds": 45
          },
          {
            "id": "preset-user-ppl:push:cable-lateral-raise:set:3",
            "setNumber": 3,
            "repMin": 15,
            "repMax": 15,
            "restSeconds": 45
          },
          {
            "id": "preset-user-ppl:push:cable-lateral-raise:set:4",
            "setNumber": 4,
            "repMin": 15,
            "repMax": 15,
            "restSeconds": 45
          }
        ],
        "notes": "1 tay"
      },
      {
        "id": "preset-user-ppl:push:leaning-cable-lateral-raise",
        "exerciseId": "user-ppl:leaning-cable-lateral-raise",
        "name": "Leaning Cable Lateral Raise",
        "order": 6,
        "sets": [
          {
            "id": "preset-user-ppl:push:leaning-cable-lateral-raise:set:1",
            "setNumber": 1,
            "repMin": 15,
            "repMax": 15,
            "restSeconds": 45
          },
          {
            "id": "preset-user-ppl:push:leaning-cable-lateral-raise:set:2",
            "setNumber": 2,
            "repMin": 15,
            "repMax": 15,
            "restSeconds": 45
          },
          {
            "id": "preset-user-ppl:push:leaning-cable-lateral-raise:set:3",
            "setNumber": 3,
            "repMin": 15,
            "repMax": 15,
            "restSeconds": 45
          }
        ]
      },
      {
        "id": "preset-user-ppl:push:overhead-tricep-extension",
        "exerciseId": "user-ppl:overhead-tricep-extension",
        "name": "Overhead Tricep Extension",
        "order": 7,
        "sets": [
          {
            "id": "preset-user-ppl:push:overhead-tricep-extension:set:1",
            "setNumber": 1,
            "repMin": 15,
            "repMax": 15,
            "restSeconds": 45
          }
        ]
      }
    ]
  },
  {
    "type": "WORKOUT",
    "name": "Pull",
    "exercises": [
      {
        "id": "preset-user-ppl:pull:barbell-row",
        "exerciseId": "row",
        "name": "Barbell Row",
        "order": 1,
        "sets": [
          {
            "id": "preset-user-ppl:pull:barbell-row:set:1",
            "setNumber": 1,
            "repMin": 6,
            "repMax": 8,
            "restSeconds": 120,
            "restSecondsMax": 180,
            "targetRpe": 8.5
          },
          {
            "id": "preset-user-ppl:pull:barbell-row:set:2",
            "setNumber": 2,
            "repMin": 6,
            "repMax": 8,
            "restSeconds": 120,
            "restSecondsMax": 180,
            "targetRpe": 8.5
          },
          {
            "id": "preset-user-ppl:pull:barbell-row:set:3",
            "setNumber": 3,
            "repMin": 6,
            "repMax": 8,
            "restSeconds": 120,
            "restSecondsMax": 180,
            "targetRpe": 8.5
          },
          {
            "id": "preset-user-ppl:pull:barbell-row:set:4",
            "setNumber": 4,
            "repMin": 6,
            "repMax": 8,
            "restSeconds": 120,
            "restSecondsMax": 180,
            "targetRpe": 8.5
          }
        ],
        "notes": "Phase: Heavy Compound"
      },
      {
        "id": "preset-user-ppl:pull:weighted-pull-ups",
        "exerciseId": "user-ppl:weighted-pull-ups",
        "name": "Weighted Pull-ups",
        "order": 2,
        "sets": [
          {
            "id": "preset-user-ppl:pull:weighted-pull-ups:set:1",
            "setNumber": 1,
            "repMin": 6,
            "repMax": 8,
            "restSeconds": 120,
            "restSecondsMax": 180,
            "targetRpe": 9
          },
          {
            "id": "preset-user-ppl:pull:weighted-pull-ups:set:2",
            "setNumber": 2,
            "repMin": 6,
            "repMax": 8,
            "restSeconds": 120,
            "restSecondsMax": 180,
            "targetRpe": 9
          },
          {
            "id": "preset-user-ppl:pull:weighted-pull-ups:set:3",
            "setNumber": 3,
            "repMin": 6,
            "repMax": 8,
            "restSeconds": 120,
            "restSecondsMax": 180,
            "targetRpe": 9
          },
          {
            "id": "preset-user-ppl:pull:weighted-pull-ups:set:4",
            "setNumber": 4,
            "repMin": 6,
            "repMax": 8,
            "restSeconds": 120,
            "restSecondsMax": 180,
            "targetRpe": 9
          }
        ],
        "notes": "Phase: Heavy Compound\nĐeo Strap"
      },
      {
        "id": "preset-user-ppl:pull:one-arm-dumbbell-row",
        "exerciseId": "user-ppl:one-arm-dumbbell-row",
        "name": "One-Arm Dumbbell Row",
        "order": 3,
        "sets": [
          {
            "id": "preset-user-ppl:pull:one-arm-dumbbell-row:set:1",
            "setNumber": 1,
            "repMin": 10,
            "repMax": 12,
            "restSeconds": 90,
            "notes": "Per side"
          },
          {
            "id": "preset-user-ppl:pull:one-arm-dumbbell-row:set:2",
            "setNumber": 2,
            "repMin": 10,
            "repMax": 12,
            "restSeconds": 90,
            "notes": "Per side"
          },
          {
            "id": "preset-user-ppl:pull:one-arm-dumbbell-row:set:3",
            "setNumber": 3,
            "repMin": 10,
            "repMax": 12,
            "restSeconds": 90,
            "notes": "Per side"
          }
        ],
        "notes": "Phase: Lat Focus\n10–12 reps/bên"
      },
      {
        "id": "preset-user-ppl:pull:neutral-lat-pulldown",
        "exerciseId": "user-ppl:neutral-lat-pulldown",
        "name": "Neutral Lat Pulldown",
        "order": 4,
        "sets": [
          {
            "id": "preset-user-ppl:pull:neutral-lat-pulldown:set:1",
            "setNumber": 1,
            "repMin": 10,
            "repMax": 12,
            "restSeconds": 90
          },
          {
            "id": "preset-user-ppl:pull:neutral-lat-pulldown:set:2",
            "setNumber": 2,
            "repMin": 10,
            "repMax": 12,
            "restSeconds": 90
          },
          {
            "id": "preset-user-ppl:pull:neutral-lat-pulldown:set:3",
            "setNumber": 3,
            "repMin": 10,
            "repMax": 12,
            "restSeconds": 90,
            "notes": "Dropset"
          }
        ],
        "notes": "Phase: Lat Focus"
      },
      {
        "id": "preset-user-ppl:pull:incline-db-rear-delt-fly",
        "exerciseId": "user-ppl:incline-db-rear-delt-fly",
        "name": "Incline DB Rear Delt Fly",
        "order": 5,
        "sets": [
          {
            "id": "preset-user-ppl:pull:incline-db-rear-delt-fly:set:1",
            "setNumber": 1,
            "repMin": 12,
            "repMax": 15,
            "restSeconds": 0
          },
          {
            "id": "preset-user-ppl:pull:incline-db-rear-delt-fly:set:2",
            "setNumber": 2,
            "repMin": 12,
            "repMax": 15,
            "restSeconds": 0
          },
          {
            "id": "preset-user-ppl:pull:incline-db-rear-delt-fly:set:3",
            "setNumber": 3,
            "repMin": 12,
            "repMax": 15,
            "restSeconds": 0
          }
        ],
        "notes": "Phase: Upper Back & Traps\nKhông nghỉ, sang ngay Dumbbell Shrug",
        "groupId": "pull-superset-a",
        "groupType": "SUPERSET",
        "groupOrder": 1
      },
      {
        "id": "preset-user-ppl:pull:dumbbell-shrug",
        "exerciseId": "user-ppl:dumbbell-shrug",
        "name": "Dumbbell Shrug",
        "order": 6,
        "sets": [
          {
            "id": "preset-user-ppl:pull:dumbbell-shrug:set:1",
            "setNumber": 1,
            "repMin": 12,
            "repMax": 15,
            "restSeconds": 60,
            "restSecondsMax": 90,
            "notes": "Rest after completing both superset exercises"
          },
          {
            "id": "preset-user-ppl:pull:dumbbell-shrug:set:2",
            "setNumber": 2,
            "repMin": 12,
            "repMax": 15,
            "restSeconds": 60,
            "restSecondsMax": 90,
            "notes": "Rest after completing both superset exercises"
          },
          {
            "id": "preset-user-ppl:pull:dumbbell-shrug:set:3",
            "setNumber": 3,
            "repMin": 12,
            "repMax": 15,
            "restSeconds": 60,
            "restSecondsMax": 90,
            "notes": "Rest after completing both superset exercises"
          }
        ],
        "notes": "Phase: Upper Back & Traps\nHơi gập người 15 độ | Đeo Strap",
        "groupId": "pull-superset-a",
        "groupType": "SUPERSET",
        "groupOrder": 2
      },
      {
        "id": "preset-user-ppl:pull:incline-db-curl",
        "exerciseId": "user-ppl:incline-db-curl",
        "name": "Incline DB Curl",
        "order": 7,
        "sets": [
          {
            "id": "preset-user-ppl:pull:incline-db-curl:set:1",
            "setNumber": 1,
            "repMin": 10,
            "repMax": 12,
            "restSeconds": 0
          },
          {
            "id": "preset-user-ppl:pull:incline-db-curl:set:2",
            "setNumber": 2,
            "repMin": 10,
            "repMax": 12,
            "restSeconds": 0
          },
          {
            "id": "preset-user-ppl:pull:incline-db-curl:set:3",
            "setNumber": 3,
            "repMin": 10,
            "repMax": 12,
            "restSeconds": 0
          }
        ],
        "notes": "Phase: Arms Finisher\nGhế 45 độ | Không nghỉ, sang ngay Hammer Curl",
        "groupId": "pull-superset-b",
        "groupType": "SUPERSET",
        "groupOrder": 1
      },
      {
        "id": "preset-user-ppl:pull:hammer-curl",
        "exerciseId": "user-ppl:hammer-curl",
        "name": "Hammer Curl",
        "order": 8,
        "sets": [
          {
            "id": "preset-user-ppl:pull:hammer-curl:set:1",
            "setNumber": 1,
            "repMin": 12,
            "repMax": 15,
            "restSeconds": 60,
            "notes": "Rest after completing both superset exercises"
          },
          {
            "id": "preset-user-ppl:pull:hammer-curl:set:2",
            "setNumber": 2,
            "repMin": 12,
            "repMax": 15,
            "restSeconds": 60,
            "notes": "Rest after completing both superset exercises"
          },
          {
            "id": "preset-user-ppl:pull:hammer-curl:set:3",
            "setNumber": 3,
            "repMin": 12,
            "repMax": 15,
            "restSeconds": 60,
            "notes": "Rest after completing both superset exercises"
          }
        ],
        "notes": "Phase: Arms Finisher",
        "groupId": "pull-superset-b",
        "groupType": "SUPERSET",
        "groupOrder": 2
      },
      {
        "id": "preset-user-ppl:pull:dumbbell-reverse-curl",
        "exerciseId": "user-ppl:dumbbell-reverse-curl",
        "name": "Dumbbell Reverse Curl",
        "order": 9,
        "sets": [
          {
            "id": "preset-user-ppl:pull:dumbbell-reverse-curl:set:1",
            "setNumber": 1,
            "repMin": 15,
            "repMax": 15,
            "restSeconds": 60
          },
          {
            "id": "preset-user-ppl:pull:dumbbell-reverse-curl:set:2",
            "setNumber": 2,
            "repMin": 15,
            "repMax": 15,
            "restSeconds": 60
          },
          {
            "id": "preset-user-ppl:pull:dumbbell-reverse-curl:set:3",
            "setNumber": 3,
            "repMin": 15,
            "repMax": 15,
            "restSeconds": 60
          }
        ],
        "notes": "Phase: Arms Finisher\nLòng bàn tay úp"
      }
    ],
    "notes": "Estimated duration: ~120 minutes."
  },
  {
    "type": "WORKOUT",
    "name": "Legs",
    "exercises": [
      {
        "id": "preset-user-ppl:legs:squat",
        "exerciseId": "user-ppl:squat",
        "name": "Squat",
        "order": 1,
        "sets": [
          {
            "id": "preset-user-ppl:legs:squat:set:1",
            "setNumber": 1,
            "repMin": 8,
            "repMax": 10,
            "restSeconds": 120,
            "restSecondsMax": 180
          },
          {
            "id": "preset-user-ppl:legs:squat:set:2",
            "setNumber": 2,
            "repMin": 8,
            "repMax": 10,
            "restSeconds": 120,
            "restSecondsMax": 180
          },
          {
            "id": "preset-user-ppl:legs:squat:set:3",
            "setNumber": 3,
            "repMin": 8,
            "repMax": 10,
            "restSeconds": 120,
            "restSecondsMax": 180
          },
          {
            "id": "preset-user-ppl:legs:squat:set:4",
            "setNumber": 4,
            "repMin": 8,
            "repMax": 10,
            "restSeconds": 120,
            "restSecondsMax": 180
          }
        ]
      },
      {
        "id": "preset-user-ppl:legs:romanian-deadlift",
        "exerciseId": "rdl",
        "name": "Romanian Deadlift",
        "order": 2,
        "sets": [
          {
            "id": "preset-user-ppl:legs:romanian-deadlift:set:1",
            "setNumber": 1,
            "repMin": 10,
            "repMax": 12,
            "restSeconds": 120
          },
          {
            "id": "preset-user-ppl:legs:romanian-deadlift:set:2",
            "setNumber": 2,
            "repMin": 10,
            "repMax": 12,
            "restSeconds": 120
          },
          {
            "id": "preset-user-ppl:legs:romanian-deadlift:set:3",
            "setNumber": 3,
            "repMin": 10,
            "repMax": 12,
            "restSeconds": 120
          }
        ]
      },
      {
        "id": "preset-user-ppl:legs:leg-press",
        "exerciseId": "legpress",
        "name": "Leg Press",
        "order": 3,
        "sets": [
          {
            "id": "preset-user-ppl:legs:leg-press:set:1",
            "setNumber": 1,
            "repMin": 10,
            "repMax": 12,
            "restSeconds": 90
          },
          {
            "id": "preset-user-ppl:legs:leg-press:set:2",
            "setNumber": 2,
            "repMin": 10,
            "repMax": 12,
            "restSeconds": 90
          },
          {
            "id": "preset-user-ppl:legs:leg-press:set:3",
            "setNumber": 3,
            "repMin": 10,
            "repMax": 12,
            "restSeconds": 90
          }
        ]
      },
      {
        "id": "preset-user-ppl:legs:hamstring-curl",
        "exerciseId": "user-ppl:hamstring-curl",
        "name": "Hamstring Curl",
        "order": 4,
        "sets": [
          {
            "id": "preset-user-ppl:legs:hamstring-curl:set:1",
            "setNumber": 1,
            "repMin": 12,
            "repMax": 12,
            "restSeconds": 60
          },
          {
            "id": "preset-user-ppl:legs:hamstring-curl:set:2",
            "setNumber": 2,
            "repMin": 12,
            "repMax": 12,
            "restSeconds": 60
          },
          {
            "id": "preset-user-ppl:legs:hamstring-curl:set:3",
            "setNumber": 3,
            "repMin": 12,
            "repMax": 12,
            "restSeconds": 60
          }
        ]
      },
      {
        "id": "preset-user-ppl:legs:leg-extension",
        "exerciseId": "user-ppl:leg-extension",
        "name": "Leg Extension",
        "order": 5,
        "sets": [
          {
            "id": "preset-user-ppl:legs:leg-extension:set:1",
            "setNumber": 1,
            "repMin": 12,
            "repMax": 15,
            "restSeconds": 60
          },
          {
            "id": "preset-user-ppl:legs:leg-extension:set:2",
            "setNumber": 2,
            "repMin": 12,
            "repMax": 15,
            "restSeconds": 60
          },
          {
            "id": "preset-user-ppl:legs:leg-extension:set:3",
            "setNumber": 3,
            "repMin": 12,
            "repMax": 15,
            "restSeconds": 60
          }
        ]
      },
      {
        "id": "preset-user-ppl:legs:calf-raise",
        "exerciseId": "calf",
        "name": "Calf Raise",
        "order": 6,
        "sets": [
          {
            "id": "preset-user-ppl:legs:calf-raise:set:1",
            "setNumber": 1,
            "repMin": 15,
            "repMax": 20,
            "restSeconds": 45
          },
          {
            "id": "preset-user-ppl:legs:calf-raise:set:2",
            "setNumber": 2,
            "repMin": 15,
            "repMax": 20,
            "restSeconds": 45
          },
          {
            "id": "preset-user-ppl:legs:calf-raise:set:3",
            "setNumber": 3,
            "repMin": 15,
            "repMax": 20,
            "restSeconds": 45
          },
          {
            "id": "preset-user-ppl:legs:calf-raise:set:4",
            "setNumber": 4,
            "repMin": 15,
            "repMax": 20,
            "restSeconds": 45
          }
        ]
      },
      {
        "id": "preset-user-ppl:legs:inner-outer-thigh",
        "exerciseId": "user-ppl:inner-outer-thigh",
        "name": "Inner/Outer Thigh",
        "order": 7,
        "sets": [
          {
            "id": "preset-user-ppl:legs:inner-outer-thigh:set:1",
            "setNumber": 1,
            "repMin": 15,
            "repMax": 15,
            "restSeconds": 45
          },
          {
            "id": "preset-user-ppl:legs:inner-outer-thigh:set:2",
            "setNumber": 2,
            "repMin": 15,
            "repMax": 15,
            "restSeconds": 45
          }
        ]
      }
    ],
    "notes": "Warmup: 5–10 minutes before Squat.\nEstimated duration: ~60–70 minutes."
  }
];
