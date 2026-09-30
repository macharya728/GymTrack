import type { Exercise } from '../types';
import type { Tutorial } from './tutorials';

/**
 * "Equipment busy" support: free-weight and bodyweight stand-ins that are not in any
 * routine, plus a curated list of alternatives for every equipment-based exercise.
 * Alternatives are ordered best-first and always train the same muscles.
 */
const ex = (
  id: string,
  name: string,
  equipment: string,
  target_muscle: string,
  cues: string,
  default_sets: number,
  default_reps: number,
): Exercise => ({ id, name, category: 'strength', equipment, target_muscle, cues, default_sets, default_reps, is_core_express: false });

export const EXTRA_EXERCISES: Exercise[] = [
  ex('pushup', 'Push-Up', 'Floor (no equipment)', 'Chest, Front Delts, Triceps', 'Hands under shoulders, body in one straight line. Lower chest to a fist above the floor. Too hard? Hands on a bench.', 3, 8),
  ex('db_bench_press', 'Dumbbell Bench Press', 'Dumbbells + Flat Bench', 'Chest, Front Delts, Triceps', 'Feet flat, shoulder blades pinched into the bench. Lower until elbows are just below the bench, press up over your chest.', 3, 10),
  ex('db_fly', 'Dumbbell Fly', 'Dumbbells + Flat Bench', 'Chest', 'Slight bend in the elbows the whole time. Open arms wide until you feel a chest stretch, then hug the air back up. Go light.', 3, 12),
  ex('db_row', 'One-Arm Dumbbell Row', 'Dumbbell + Bench', 'Lats, Mid Back, Biceps', 'One hand and knee on the bench, back flat. Pull the dumbbell to your hip, elbow past your ribs. Do all reps, then switch arms.', 3, 10),
  ex('db_pullover', 'Dumbbell Pullover', 'Dumbbell + Flat Bench', 'Lats, Chest', 'Lie across or along the bench holding one dumbbell over your chest. Arc it back over your head with soft elbows, then pull it back up.', 3, 12),
  ex('db_woodchop', 'Standing Dumbbell Woodchop', 'Light Dumbbell', 'Obliques, Core, Shoulders', 'Hold one dumbbell with both hands by your hip. Rotate and lift diagonally across to above the opposite shoulder, pivoting your back foot. Do all reps, then switch sides.', 3, 10),
  ex('russian_twist', 'Russian Twist', 'Floor (no equipment)', 'Obliques, Core', 'Sit leaning back with knees bent, chest tall. Rotate your shoulders side to side, tapping the floor each time. One rep = one side.', 3, 20),
  ex('split_squat', 'Split Squat (each leg)', 'Floor (no equipment)', 'Quads, Glutes', 'Long step forward, back knee dropping straight down. Front heel stays planted. Do all reps on one leg, then switch.', 3, 10),
  ex('bodyweight_squat', 'Bodyweight Squat', 'Floor (no equipment)', 'Quads, Glutes', 'Feet shoulder-width, sit back and down until thighs are about parallel, chest up. Push through the whole foot to stand.', 3, 15),
  ex('glute_bridge', 'Glute Bridge', 'Mat', 'Glutes, Hamstrings', 'Lie on your back, knees bent, feet flat. Push your hips up until shoulders, hips and knees are in a line. Squeeze, pause, lower.', 3, 15),
  ex('db_rdl', 'Dumbbell Romanian Deadlift', 'Dumbbells', 'Hamstrings, Glutes, Lower Back', 'Soft knees, dumbbells slide down your thighs as your hips push back. Flat back. Stop when you feel a hamstring stretch, then drive hips forward.', 3, 10),
  ex('lying_leg_raise', 'Lying Leg Raise', 'Mat', 'Lower Abs, Hip Flexors', 'Lie flat, lower back pressed into the floor. Raise straight legs to vertical, then lower slowly, stopping before your back arches.', 3, 12),
  ex('db_shoulder_press', 'Dumbbell Shoulder Press', 'Dumbbells + Bench', 'Shoulders, Triceps', 'Sit tall with back support. Start with dumbbells at ear height, press overhead without arching your back, lower under control.', 3, 10),
  ex('db_lateral_raise', 'Dumbbell Lateral Raise', 'Light Dumbbells', 'Side Delts', 'Very light weight. Raise arms out to shoulder height with a slight elbow bend, pause, lower slowly. No swinging.', 3, 12),
];

export const EXTRA_BODYWEIGHT = ['pushup', 'russian_twist', 'split_squat', 'bodyweight_squat', 'glute_bridge', 'lying_leg_raise'];
export const EXTRA_DUMBBELL = ['db_bench_press', 'db_fly', 'db_row', 'db_pullover', 'db_woodchop', 'db_rdl', 'db_shoulder_press', 'db_lateral_raise'];

export interface Alternative {
  id: string;
  why: string;
}

export const ALTERNATIVES: Record<string, Alternative[]> = {
  chest_press: [
    { id: 'db_bench_press', why: 'Same muscles. Dumbbells are usually free.' },
    { id: 'pushup', why: 'No equipment at all.' },
    { id: 'machine_pec_fly', why: 'Chest again, if the fly machine is free.' },
  ],
  lat_pulldown: [
    { id: 'db_row', why: 'Trains the same back muscles.' },
    { id: 'db_pullover', why: 'Stretches and works the lats with one dumbbell.' },
    { id: 'cable_row', why: 'Another back exercise, if that cable is free.' },
  ],
  cable_row: [
    { id: 'db_row', why: 'Same pulling motion, one arm at a time.' },
    { id: 'lat_pulldown', why: 'Back again, if the pulldown is free.' },
  ],
  cable_woodchopper: [
    { id: 'db_woodchop', why: 'Same rotation with a dumbbell. Great for karate.' },
    { id: 'russian_twist', why: 'No equipment. Rotational core work.' },
  ],
  leg_press: [
    { id: 'goblet_squat', why: 'Best swap for legs. One dumbbell.' },
    { id: 'split_squat', why: 'No equipment. Quads and glutes.' },
    { id: 'bodyweight_squat', why: 'Easiest, no equipment.' },
  ],
  hamstring_curl: [
    { id: 'glute_bridge', why: 'No equipment. Hamstrings and glutes.' },
    { id: 'db_rdl', why: 'Hamstrings with a dumbbell.' },
  ],
  leg_extension: [
    { id: 'split_squat', why: 'Quads, no equipment.' },
    { id: 'goblet_squat', why: 'Quads with one dumbbell.' },
    { id: 'bodyweight_squat', why: 'Easiest, no equipment.' },
  ],
  captains_chair_knee_raise: [
    { id: 'lying_leg_raise', why: 'Same lower-ab work on the floor.' },
    { id: 'plank', why: 'Core hold. Just a mat.' },
  ],
  goblet_squat: [
    { id: 'split_squat', why: 'No equipment. Quads and glutes.' },
    { id: 'bodyweight_squat', why: 'No weight needed.' },
  ],
  machine_shoulder_press: [
    { id: 'db_shoulder_press', why: 'Same muscles with dumbbells.' },
    { id: 'db_lateral_raise', why: 'Side delts, very light weight.' },
  ],
  machine_pec_fly: [
    { id: 'db_fly', why: 'Same chest motion with dumbbells.' },
    { id: 'pushup', why: 'No equipment at all.' },
  ],
  sauna_session: [{ id: 'steam_room_session', why: 'Same heat recovery. Shorter stay is fine.' }],
  steam_room_session: [{ id: 'sauna_session', why: 'Same heat recovery. Dry heat instead of steam.' }],
};

const T = (setup: string[], steps: string[], mistakes: string[], search: string): Tutorial => ({ setup, steps, mistakes, search });

export const EXTRA_TUTORIALS: Record<string, Tutorial> = {
  pushup: T(
    ['Place hands just wider than shoulders, fingers forward.', 'Walk feet back until your body is one straight line.', 'Too hard? Put your hands on a bench or the Smith bar to make it easier.'],
    ['Tighten your stomach and glutes.', 'Lower until your chest is a fist above the floor, elbows about 45° from your body.', 'Push the floor away until your arms are straight.'],
    ['Hips sagging or piking up', 'Elbows flaring straight out to the sides', 'Half reps'],
    'push up proper form beginner',
  ),
  db_bench_press: T(
    ['Pick two matching dumbbells. Start lighter than you think.', 'Sit on the bench end with dumbbells on your thighs, then lie back and kick them up one at a time.', 'Feet flat, shoulder blades pinched together.'],
    ['Start with dumbbells over your chest, arms straight.', 'Lower slowly until elbows are just below the bench.', 'Press back up over your chest.'],
    ['Flaring elbows straight out', 'Bouncing at the bottom', 'Going too heavy to control'],
    'dumbbell bench press proper form',
  ),
  db_fly: T(
    ['Use light dumbbells. This is a stretch exercise, not a heavy one.', 'Lie on the bench with dumbbells over your chest, palms facing each other.'],
    ['Keep a slight bend in your elbows and hold it.', 'Open your arms out until you feel your chest stretch.', 'Bring the dumbbells back together like a hug.'],
    ['Going too heavy', 'Straightening the elbows or bending them into a press', 'Dropping arms below the chest'],
    'dumbbell chest fly proper form',
  ),
  db_row: T(
    ['Put your left hand and knee on the bench, right foot on the floor, back flat.', 'Hold a dumbbell in your right hand, arm hanging straight down.'],
    ['Pull the dumbbell toward your hip, elbow going past your ribs.', 'Squeeze your shoulder blade, pause a moment.', 'Lower slowly. Finish all reps, then switch arms.'],
    ['Twisting your body to swing it up', 'Pulling with the arm instead of the back', 'Rounding your back'],
    'one arm dumbbell row proper form',
  ),
  db_pullover: T(
    ['Lie on your back on the bench, or across it with only your upper back supported.', 'Hold one dumbbell with both hands over your chest, arms nearly straight.'],
    ['Slowly arc the dumbbell back over your head until you feel your lats stretch.', 'Pull it back over your chest using your back and chest.'],
    ['Bending the elbows into a triceps extension', 'Going too heavy', 'Arching your lower back'],
    'dumbbell pullover proper form',
  ),
  db_woodchop: T(
    ['Use a light dumbbell. Hold it with both hands beside one hip.', 'Feet a bit wider than shoulders.'],
    ['Rotate through your torso and lift the dumbbell diagonally to above the opposite shoulder.', 'Pivot your back foot as you turn.', 'Lower with control. Finish all reps, then switch sides.'],
    ['Only using your arms', 'Twisting through the lower back instead of turning the hips and feet', 'Going too heavy'],
    'standing dumbbell woodchop',
  ),
  russian_twist: T(
    ['Sit on the floor, knees bent, heels down or lifted if you can.', 'Lean back until your abs are working, chest tall.'],
    ['Clasp your hands and rotate your shoulders to one side.', 'Rotate to the other side. That is 2 reps.', 'Breathe steadily.'],
    ['Rounding the back', 'Just swinging the arms', 'Rushing'],
    'russian twist proper form',
  ),
  split_squat: T(
    ['Take a long step forward. Feet stay hip-width apart, not on a tightrope.', 'Stand tall, hands on hips.'],
    ['Lower your back knee straight down toward the floor.', 'Keep your front heel on the floor and your torso upright.', 'Push through the front foot to stand. Finish all reps, then switch legs.'],
    ['Front knee caving in', 'Leaning far forward', 'Stance too short'],
    'split squat proper form beginner',
  ),
  bodyweight_squat: T(
    ['Stand with feet shoulder-width apart, toes slightly out.'],
    ['Sit your hips back and down like sitting into a chair.', 'Go until thighs are about parallel, chest up.', 'Push through your whole foot to stand.'],
    ['Knees caving in', 'Heels lifting', 'Rounding your back'],
    'bodyweight squat proper form',
  ),
  glute_bridge: T(
    ['Lie on your back, knees bent, feet flat hip-width apart, close to your hips.'],
    ['Push through your heels and lift your hips until shoulders, hips and knees form a line.', 'Squeeze your glutes at the top for a second.', 'Lower slowly.'],
    ['Arching the lower back at the top', 'Pushing through the toes', 'Rushing'],
    'glute bridge proper form',
  ),
  db_rdl: T(
    ['Hold two dumbbells in front of your thighs, feet hip-width apart, soft knees.'],
    ['Push your hips back and slide the dumbbells down your thighs, back flat.', 'Stop when you feel a hamstring stretch, around the knees or just below.', 'Drive your hips forward to stand tall.'],
    ['Rounding your back', 'Squatting down instead of hinging back', 'Dumbbells drifting away from your legs'],
    'dumbbell romanian deadlift proper form',
  ),
  lying_leg_raise: T(
    ['Lie flat on a mat, hands under your hips or by your sides.', 'Press your lower back into the floor.'],
    ['Raise straight legs up to vertical.', 'Lower slowly, stopping before your back lifts off the floor.', 'Bend the knees if it is too hard.'],
    ['Lower back arching up', 'Swinging the legs with momentum', 'Holding your breath'],
    'lying leg raise proper form',
  ),
  db_shoulder_press: T(
    ['Sit on a bench with back support and dumbbells at ear height, palms forward.', 'Start light.'],
    ['Press up until your arms are almost straight over your shoulders.', 'Lower slowly back to ear height.', 'Keep your ribs down, no arching.'],
    ['Arching your lower back', 'Dumbbells drifting forward', 'Shrugging'],
    'seated dumbbell shoulder press proper form',
  ),
  db_lateral_raise: T(
    ['Use very light dumbbells. Stand tall with arms by your sides.'],
    ['Raise your arms out to the sides to shoulder height, slight elbow bend.', 'Pause, then lower slowly.'],
    ['Swinging with your body', 'Going above shoulder height', 'Going too heavy'],
    'dumbbell lateral raise proper form',
  ),
};
