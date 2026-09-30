/**
 * Written how-to content for every exercise in seed.json.
 * `setup` / `steps` headings change by category (see TUTORIAL_HEADINGS).
 */
export interface Tutorial {
  setup: string[];
  steps: string[];
  mistakes: string[];
  /** YouTube search used for the default "Watch a form video" link */
  search: string;
  /** Machine settings worth remembering, used as quick-add suggestions */
  settingHints?: string[];
}

export const TUTORIAL_HEADINGS = {
  strength: ['Set up', 'Do the rep'],
  stretch: ['Get into position', 'Hold it'],
  swim: ['Before you push off', 'The set'],
  recovery: ['Before you go in', 'While you’re in'],
} as const;

export const TUTORIALS: Record<string, Tutorial> = {
  chest_press: {
    setup: [
      'Raise or lower the seat until the handles line up with the middle of your chest.',
      'Move the pin to a light weight for your first set. You can go up next set.',
      'Sit with your back flat on the pad and feet flat on the floor.',
    ],
    steps: [
      'Grip the handles with straight wrists, elbows about 45° from your body.',
      'Breathe out and press until your arms are almost straight. Don’t lock your elbows.',
      'Take 2–3 seconds to come back. Stop just before the plates touch.',
    ],
    mistakes: ['Shoulders shrugging up toward your ears', 'Lower back arching off the pad', 'Letting the weight stack slam down'],
    search: 'machine chest press proper form',
    settingHints: ['Seat', 'Handles'],
  },
  lat_pulldown: {
    setup: [
      'Set the thigh pad so your thighs are locked snugly underneath it.',
      'Move the pin to your weight.',
      'Stand, grab the bar a little wider than your shoulders, then sit down with arms straight.',
    ],
    steps: [
      'Lean back slightly (about 10°) with your chest up.',
      'Pull the bar to the top of your chest by driving your elbows down and back.',
      'Squeeze your shoulder blades down, then let the bar rise slowly until your arms are nearly straight.',
    ],
    mistakes: ['Pulling the bar behind your neck', 'Swinging your body back to move the weight', 'Stopping halfway instead of reaching your chest'],
    search: 'seated lat pulldown proper form',
    settingHints: ['Thigh pad'],
  },
  cable_row: {
    setup: [
      'Clip a V-grip (neutral) handle to the low pulley.',
      'Move the pin to your weight.',
      'Sit with feet on the footplates and knees slightly bent.',
    ],
    steps: [
      'Sit tall with arms straight out in front.',
      'Pull the handle to your lower ribs, keeping elbows close to your body.',
      'Squeeze your shoulder blades together for a second, then let your arms straighten slowly.',
    ],
    mistakes: ['Rounding your lower back', 'Rocking your torso back and forth', 'Shrugging your shoulders up'],
    search: 'seated cable row proper form',
  },
  cable_woodchopper: {
    setup: [
      'Set the pulley to chest height and clip on a single handle or rope.',
      'Start light. This is about speed and control, not load.',
      'Stand side-on to the machine, one big step away, feet wider than shoulders.',
    ],
    steps: [
      'Hold the handle with both hands, arms straight in front of your chest.',
      'Rotate away from the machine, pivoting your back foot like a reverse punch. Let your hips drive it.',
      'Come back slowly. Finish all reps, then switch sides.',
    ],
    mistakes: ['Bending your arms and pulling with them', 'Twisting only from the lower back with your hips locked', 'Going too heavy and losing control on the way back'],
    search: 'cable torso rotation standing proper form',
    settingHints: ['Pulley height'],
  },
  hip_flexor_stretch: {
    setup: [
      'Kneel on a mat with one knee down (fold the mat under it if needed).',
      'Put the other foot forward so the front knee bends to about 90°.',
    ],
    steps: [
      'Tuck your pelvis under by squeezing the glute of the back leg.',
      'Shift your hips gently forward until you feel it at the front of the back hip.',
      'Reach the same-side arm overhead and lean slightly away. Breathe and hold, then switch sides.',
    ],
    mistakes: ['Arching your lower back instead of tucking your pelvis', 'Bouncing into the stretch', 'Pushing into pain instead of a steady pull'],
    search: 'kneeling hip flexor stretch how to',
  },
  wall_shoulder_stretch: {
    setup: ['Stand about an arm’s length from a wall.', 'Put your hands flat on the wall at shoulder height, shoulder-width apart.'],
    steps: [
      'Hinge at your hips and walk your feet back.',
      'Let your chest sink toward the floor with arms straight and head between them.',
      'Breathe slowly into the stretch.',
    ],
    mistakes: ['Shrugging your shoulders to your ears', 'Bending your elbows', 'Forcing it until your shoulder pinches'],
    search: 'wall lat stretch shoulder extension',
  },
  swim_warmup: {
    setup: ['Adjust your goggles before you get in.', 'Pick the slow or medium lane.'],
    steps: [
      '100 m is 4 lengths of the 25 m pool.',
      'Easy freestyle or breaststroke. Breathe out fully underwater.',
      'Make each stroke long and glide a little at the end of each one.',
    ],
    mistakes: ['Starting too fast', 'Holding your breath underwater'],
    search: 'swimming warm up beginner freestyle breathing',
  },
  swim_freestyle_stamina: {
    setup: ['4 × 50 m: each 50 is 2 lengths.', 'Rest 30 seconds at the wall after each one.'],
    steps: [
      'Swim at a steady, moderate effort (about 6 out of 10). You should finish each 50 able to go again.',
      'Breathe every 3 strokes, or every 2 if you need more air.',
      'Turn your head to the side to breathe. Keep one goggle in the water.',
    ],
    mistakes: ['Lifting your head forward to breathe, which sinks your hips', 'Sprinting the first 50 and fading on the rest'],
    search: 'freestyle breathing technique beginner',
  },
  swim_kickboard_drills: {
    setup: ['Grab a kickboard from the pool deck.', 'Hold its top edge with arms stretched out in front.'],
    steps: [
      '4 × 25 m, one length each.',
      'Flutter kick: kick from your hips with small, fast kicks and loose ankles.',
      'Or breaststroke whip kick: heels up toward your seat, feet turned out, then snap them around and together.',
      'Keep your hips high, near the surface.',
    ],
    mistakes: ['Bending your knees a lot, like pedalling a bicycle', 'Pushing down on the board so your hips sink'],
    search: 'kickboard flutter kick technique',
  },
  swim_cooldown: {
    setup: ['Take a short breather at the wall first if you need it.'],
    steps: ['100 m (4 lengths) of slow backstroke or relaxed breaststroke.', 'Slow your breathing down as you go.'],
    mistakes: ['Skipping it and walking straight into the sauna with your heart still racing'],
    search: 'easy backstroke technique beginner',
  },
  sauna_session: {
    setup: [
      'Drink some water first, especially straight after a swim.',
      'Quick rinse in the shower and bring a clean towel to sit on.',
      'Skip it today if you feel unwell or light-headed.',
    ],
    steps: [
      'Stay 10–12 minutes. The lower bench is cooler if it feels too hot.',
      'Leave straight away if you feel dizzy, sick or get a headache.',
      'Cool shower when you come out, then drink water.',
    ],
    mistakes: ['Going in dehydrated after a hard session', 'Staying longer to "sweat more"'],
    search: 'sauna after workout safety tips',
  },
  butterfly_stretch: {
    setup: ['Sit on the mat and bring the soles of your feet together.', 'Pull your heels in toward you as far as is comfortable.'],
    steps: [
      'Hold your feet and sit up tall.',
      'Use your elbows to press your knees gently toward the floor.',
      'Breathe out and relax a little deeper each time.',
    ],
    mistakes: ['Rounding your back to get lower', 'Bouncing your knees hard'],
    search: 'seated butterfly stretch how to',
  },
  frog_stretch: {
    setup: [
      'Start on hands and knees on a mat. Double it up under your knees.',
      'Slide your knees out wide, shins parallel, feet turned out, ankles in line with knees.',
    ],
    steps: [
      'Lower onto your forearms if you can.',
      'Rock your hips slowly back toward your heels until you feel your inner thighs.',
      'Hold still and breathe. Rock forward a little if it’s too much.',
    ],
    mistakes: ['Forcing your knees wider until they hurt', 'Letting your lower back sag or arch'],
    search: 'frog stretch adductors how to',
  },
  straddle_stretch: {
    setup: ['Sit with legs in a wide V, toes pointing up.', 'Sit tall. Sit on a folded mat if your back rounds.'],
    steps: [
      'Hinge forward from your hips, keeping your back flat.',
      'Walk your fingertips forward until you feel your hamstrings and inner thighs.',
      'Breathe and hold. This is the range for roundhouse and side kicks.',
    ],
    mistakes: ['Rounding your spine to reach further', 'Letting your toes roll inward'],
    search: 'seated straddle stretch flat back',
  },
  pigeon_pose: {
    setup: [
      'From hands and knees, bring your right knee forward behind your right wrist.',
      'Angle your right shin across the mat and slide your left leg straight back.',
    ],
    steps: [
      'Square your hips to the front.',
      'Lower your chest onto your forearms.',
      'Breathe and hold, then switch sides.',
    ],
    mistakes: ['Dropping all your weight onto one hip', 'Pushing through knee pain. Bring the foot closer to you or put a towel under your hip.'],
    search: 'pigeon stretch beginner how to',
  },
  thoracic_twist: {
    setup: ['Start on hands and knees, hands under shoulders, knees under hips.'],
    steps: [
      'Slide your right arm under your body, palm up, until your right shoulder and ear rest on the mat.',
      'Breathe out and let your upper back rotate.',
      'Come back, reach that arm to the ceiling, then switch sides.',
    ],
    mistakes: ['Shifting your hips sideways', 'Holding your breath'],
    search: 'thread the needle stretch thoracic',
  },
  steam_room_session: {
    setup: ['Drink water first.', 'Quick rinse in the shower before you go in.'],
    steps: [
      '8–10 minutes in the steam room.',
      'Do slow neck rolls and wrist circles while you sit.',
      'Then move to the warm spa pool and sit in front of the jets.',
      'Leave straight away if you feel dizzy or unwell.',
    ],
    mistakes: ['Staying past 10 minutes', 'Skipping water afterwards'],
    search: 'steam room after workout tips',
  },
  leg_press: {
    setup: [
      'Adjust the back rest so your knees reach about 90° at the bottom, not up at your chest.',
      'Feet shoulder-width in the middle of the plate.',
      'Set the pin and hold the side handles.',
    ],
    steps: [
      'Push through your heels and mid-foot.',
      'Straighten your legs without locking your knees.',
      'Lower slowly until your knees are at about 90°. Keep your lower back pressed into the pad.',
    ],
    mistakes: ['Locking your knees at the top', 'Going so deep that your hips lift off the seat', 'Knees caving inward'],
    search: 'seated leg press machine proper form',
    settingHints: ['Back rest', 'Seat'],
  },
  hamstring_curl: {
    setup: [
      'Line your knees up with the machine’s pivot (the round axis on the side).',
      'Set the leg pad just above your heels.',
      'Lower the thigh pad so it holds your legs snugly. Set the pin.',
    ],
    steps: [
      'Pull your heels down and under the seat.',
      'Squeeze for a second at the bottom.',
      'Let your legs come back up slowly.',
    ],
    mistakes: ['Lifting your hips off the seat', 'Letting the weight snap back up', 'Knees not lined up with the pivot'],
    search: 'seated leg curl machine proper form',
    settingHints: ['Back rest', 'Leg pad'],
  },
  leg_extension: {
    setup: [
      'Back flat against the pad, knees lined up with the pivot.',
      'Set the ankle pad on the front of your lower shins, just above your feet.',
      'Hold the side handles.',
    ],
    steps: ['Straighten your legs fully.', 'Squeeze your quads for a second at the top.', 'Lower over 2–3 seconds.'],
    mistakes: ['Kicking the weight up fast', 'Lifting your hips off the seat'],
    search: 'leg extension machine proper form',
    settingHints: ['Back rest', 'Ankle pad'],
  },
  captains_chair_knee_raise: {
    setup: ['Step up and press your back flat against the pad.', 'Rest your forearms on the arm pads and grip the handles. Let your legs hang.'],
    steps: [
      'Brace your abs and bring your knees up toward your chest by curling your pelvis.',
      'Pause at the top.',
      'Lower slowly without swinging.',
    ],
    mistakes: ['Swinging your legs for momentum', 'Shrugging your shoulders up'],
    search: 'captains chair knee raise proper form',
  },
  hamstring_pike_stretch: {
    setup: ['Sit with legs straight out together.', 'Pull your toes back toward you.'],
    steps: ['Hinge from your hips and reach toward your ankles or toes.', 'Keep your chest open and breathe.'],
    mistakes: ['Rounding your upper back to get your hands further', 'Bouncing to reach further'],
    search: 'seated hamstring stretch pike',
  },
  swim_intervals: {
    setup: ['Pick a lane where sprinting won’t cut off slower swimmers.', 'Have a clock or the timer ready for your rests.'],
    steps: [
      '4 × 25 m sprints, one length each, fast.',
      'Rest 45 seconds at the wall after each one.',
      'Then 2 × 100 m at a smooth, steady pace.',
    ],
    mistakes: ['Cutting the rest short', 'Stroke falling apart when you’re tired. Slow down a little and keep it clean.'],
    search: 'freestyle sprint technique 25m',
  },
  goblet_squat: {
    setup: [
      'Pick a light dumbbell (8–12 kg).',
      'Hold it upright against your chest by the top end, elbows pointing down.',
      'Feet a bit wider than your shoulders, toes turned out slightly.',
    ],
    steps: [
      'Sit your hips down between your heels with your chest up.',
      'At the bottom, your elbows go just inside your knees.',
      'Drive back up through your whole foot.',
    ],
    mistakes: ['Heels lifting off the floor', 'Knees caving inward', 'Chest dropping forward'],
    search: 'goblet squat proper form',
  },
  machine_shoulder_press: {
    setup: ['Adjust the seat so the handles start around chin height.', 'Back flat against the pad. Set the pin.'],
    steps: [
      'Press straight up without arching your lower back.',
      'Stop just before your elbows lock.',
      'Lower slowly back to chin height.',
    ],
    mistakes: ['Arching your back off the pad', 'Shrugging your shoulders', 'Dropping the weight fast'],
    search: 'seated machine shoulder press proper form',
    settingHints: ['Seat'],
  },
  machine_pec_fly: {
    setup: [
      'Adjust the seat so the handles are at chest height.',
      'Chest fly: back against the pad. Rear delt: turn around and face the pad.',
      'Set the arm start position so you feel a light stretch, not a strain.',
    ],
    steps: [
      'Keep a slight, fixed bend in your elbows.',
      'Bring your arms around in a wide arc until the handles meet.',
      'Squeeze for a second, then return slowly until your arms are level with your body.',
    ],
    mistakes: ['Bending and straightening your elbows, which turns it into a press', 'Letting your arms go too far back'],
    search: 'pec deck machine fly proper form',
    settingHints: ['Seat', 'Arm start'],
  },
  plank: {
    setup: ['Forearms on the mat, elbows under your shoulders.', 'Step your feet back so your body forms a straight line.'],
    steps: [
      'Tuck your tailbone and squeeze your glutes.',
      'Brace your stomach as if you’re about to take a kick.',
      'Keep breathing through the whole hold.',
    ],
    mistakes: ['Hips sagging toward the floor', 'Hips piked up high', 'Holding your breath'],
    search: 'forearm plank proper form',
  },
};

export const youtubeSearchUrl = (q: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
