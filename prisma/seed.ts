import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/database.js";

const ADMIN_EMAIL = "admin@innovatech.com";
const ADMIN_PASSWORD = "password";

const USERS = [
  {
    name: "Juan Dela Cruz",
    class: "Grade 10 - Section A",
    school: "Innovatech High School",
    guardianName: "Maria Dela Cruz",
    guardianEmail: "maria.dc@email.com",
    guardianPhone: "09171234567",
  },
  {
    name: "Maria Santos",
    class: "Grade 10 - Section A",
    school: "Innovatech High School",
    guardianName: "Pedro Santos",
    guardianEmail: "pedro.santos@email.com",
    guardianPhone: "09171234568",
  },
  {
    name: "Jose Rizal",
    class: "Grade 10 - Section B",
    school: "Innovatech High School",
    guardianName: "Teodora Rizal",
    guardianEmail: "teodora.rizal@email.com",
    guardianPhone: "09171234569",
  },
];

const COURSES = [
  {
    name: "Mathematics",
    description:
      "Explore algebra, geometry, and problem-solving techniques that build a strong mathematical foundation.",
    imageUrl: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400",
    lessons: [
      {
        title: "Introduction to Algebra",
        summary: "Learn the basics of algebraic expressions and equations.",
        content:
          "Algebra is a branch of mathematics that uses symbols to represent numbers and quantities in formulas and equations. In this lesson, we will cover variables, constants, coefficients, and how to solve simple linear equations.",
        videoUrl: "https://example.com/videos/algebra-intro.mp4",
        videoSize: "45.2 MB",
        videoHash: "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6",
      },
      {
        title: "Geometry Fundamentals",
        summary: "Understand shapes, angles, and basic geometric theorems.",
        content:
          "Geometry deals with the properties and relationships of points, lines, surfaces, and solids. This lesson covers triangles, circles, angles, and the Pythagorean theorem.",
        videoUrl: "https://example.com/videos/geometry-fundamentals.mp4",
        videoSize: "52.1 MB",
        videoHash: "b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7",
      },
    ],
    practice: {
      title: "Mathematics Fundamentals - Quiz",
      questions: [
        {
          question: "What is the value of x in the equation 2x + 5 = 15?",
          options: ["5", "10", "7.5", "20"],
          correctAnswer: "5",
          explanation: "2x + 5 = 15 → 2x = 10 → x = 5",
        },
        {
          question: "What is the sum of the interior angles of a triangle?",
          options: ["180°", "360°", "90°", "270°"],
          correctAnswer: "180°",
          explanation: "The interior angles of any triangle always sum to 180 degrees.",
        },
        {
          question: "What is 25% of 200?",
          options: ["25", "50", "75", "100"],
          correctAnswer: "50",
          explanation: "25% = 0.25, and 0.25 × 200 = 50.",
        },
        {
          question: "What is the square root of 144?",
          options: ["10", "11", "12", "14"],
          correctAnswer: "12",
          explanation: "12 × 12 = 144, so √144 = 12.",
        },
        {
          question: "What is the slope of the line y = 3x + 2?",
          options: ["2", "3", "-3", "1/3"],
          correctAnswer: "3",
          explanation: "In the form y = mx + b, the slope m is the coefficient of x, which is 3.",
        },
        {
          question: "What is the area of a rectangle with length 8 and width 5?",
          options: ["13", "26", "40", "45"],
          correctAnswer: "40",
          explanation: "Area = length × width = 8 × 5 = 40 square units.",
        },
        {
          question: "What is the next prime number after 7?",
          options: ["8", "9", "10", "11"],
          correctAnswer: "11",
          explanation: "8, 9, and 10 are all composite numbers. 11 is the next prime.",
        },
        {
          question: "What is 2³?",
          options: ["4", "6", "8", "9"],
          correctAnswer: "8",
          explanation: "2³ = 2 × 2 × 2 = 8.",
        },
        {
          question: "What is the greatest common divisor (GCD) of 12 and 18?",
          options: ["2", "3", "6", "9"],
          correctAnswer: "6",
          explanation: "The GCD of 12 and 18 is 6, since 6 divides both 12 and 18 evenly.",
        },
        {
          question: "If a circle has a radius of 7, what is its circumference? (Use π ≈ 3.14)",
          options: ["21.98", "43.96", "49.00", "153.86"],
          correctAnswer: "43.96",
          explanation: "Circumference = 2πr = 2 × 3.14 × 7 = 43.96.",
        },
      ],
    },
  },
  {
    name: "Science",
    description:
      "Discover the wonders of biology, chemistry, and physics through interactive lessons.",
    imageUrl: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400",
    lessons: [
      {
        title: "The Cell: Building Block of Life",
        summary: "Explore the structure and function of cells.",
        content:
          "Cells are the basic structural and functional units of all living organisms. This lesson covers the cell membrane, nucleus, mitochondria, and the differences between plant and animal cells.",
        videoUrl: "https://example.com/videos/cell-biology.mp4",
        videoSize: "58.7 MB",
        videoHash: "c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8",
      },
      {
        title: "Chemical Reactions Basics",
        summary: "Learn how substances interact and transform.",
        content:
          "Chemical reactions involve the rearrangement of atoms to form new substances. This lesson introduces reactants and products, balancing equations, and the law of conservation of mass.",
        videoUrl: "https://example.com/videos/chemical-reactions.mp4",
        videoSize: "49.3 MB",
        videoHash: "d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9",
      },
    ],
    practice: {
      title: "Science Basics - Quiz",
      questions: [
        {
          question: "What is the powerhouse of the cell?",
          options: ["Nucleus", "Mitochondria", "Ribosome", "Golgi apparatus"],
          correctAnswer: "Mitochondria",
          explanation:
            "Mitochondria generate most of the cell's supply of ATP, used as a source of chemical energy.",
        },
        {
          question: "What is the chemical symbol for water?",
          options: ["H2O", "CO2", "NaCl", "O2"],
          correctAnswer: "H2O",
          explanation: "Water is composed of two hydrogen atoms and one oxygen atom, hence H2O.",
        },
        {
          question: "What planet is known as the Red Planet?",
          options: ["Venus", "Mars", "Jupiter", "Saturn"],
          correctAnswer: "Mars",
          explanation: "Mars appears reddish due to iron oxide (rust) on its surface.",
        },
        {
          question: "What gas do plants absorb from the atmosphere during photosynthesis?",
          options: ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"],
          correctAnswer: "Carbon dioxide",
          explanation: "Plants use CO2 during photosynthesis to produce glucose and oxygen.",
        },
        {
          question: "What is the speed of light approximately?",
          options: ["3 × 10⁶ m/s", "3 × 10⁸ m/s", "3 × 10¹⁰ m/s", "3 × 10⁴ m/s"],
          correctAnswer: "3 × 10⁸ m/s",
          explanation:
            "The speed of light in a vacuum is approximately 299,792,458 m/s, or 3 × 10⁸ m/s.",
        },
        {
          question: "What is the pH of a neutral substance?",
          options: ["0", "7", "10", "14"],
          correctAnswer: "7",
          explanation: "A pH of 7 is neutral. Values below 7 are acidic, above 7 are basic.",
        },
        {
          question: "Which force keeps planets in orbit around the Sun?",
          options: ["Magnetism", "Friction", "Gravity", "Centrifugal force"],
          correctAnswer: "Gravity",
          explanation:
            "The gravitational pull of the Sun keeps planets in their elliptical orbits.",
        },
        {
          question: "What is the smallest unit of a chemical element?",
          options: ["Molecule", "Atom", "Proton", "Electron"],
          correctAnswer: "Atom",
          explanation:
            "An atom is the smallest unit of an element that retains its chemical properties.",
        },
        {
          question: "What type of rock is formed from cooled magma?",
          options: ["Sedimentary", "Metamorphic", "Igneous", "Fossilized"],
          correctAnswer: "Igneous",
          explanation: "Igneous rocks form when magma or lava cools and solidifies.",
        },
        {
          question: "What system is responsible for circulating blood in the body?",
          options: ["Respiratory", "Nervous", "Digestive", "Circulatory"],
          correctAnswer: "Circulatory",
          explanation:
            "The circulatory system (heart, blood, blood vessels) transports oxygen and nutrients throughout the body.",
        },
      ],
    },
  },
  {
    name: "English Language",
    description: "Master grammar, expand your vocabulary, and improve reading comprehension.",
    imageUrl: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400",
    lessons: [
      {
        title: "Parts of Speech",
        summary: "Identify and use nouns, verbs, adjectives, and more.",
        content:
          "The eight parts of speech — nouns, pronouns, verbs, adjectives, adverbs, prepositions, conjunctions, and interjections — are the building blocks of English grammar. This lesson explains each with examples.",
        videoUrl: "https://example.com/videos/parts-of-speech.mp4",
        videoSize: "41.8 MB",
        videoHash: "e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0",
      },
      {
        title: "Writing Effective Paragraphs",
        summary: "Learn to structure clear and cohesive paragraphs.",
        content:
          "A well-structured paragraph contains a topic sentence, supporting details, and a concluding sentence. This lesson covers topic selection, transition words, and how to maintain coherence.",
        videoUrl: "https://example.com/videos/writing-paragraphs.mp4",
        videoSize: "38.5 MB",
        videoHash: "f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1",
      },
    ],
    practice: {
      title: "English Language Essentials - Quiz",
      questions: [
        {
          question:
            "Which word is a noun in the sentence 'The quick brown fox jumps over the lazy dog'?",
          options: ["quick", "jumps", "dog", "over"],
          correctAnswer: "dog",
          explanation:
            "'Dog' is a noun (a person, place, or thing). 'Quick' and 'jumps' are adjectives/verbs.",
        },
        {
          question: "What is the past tense of 'go'?",
          options: ["goed", "gone", "went", "going"],
          correctAnswer: "went",
          explanation: "'Go' is an irregular verb; its past tense is 'went'.",
        },
        {
          question: "Which sentence is grammatically correct?",
          options: [
            "He don't like coffee.",
            "She doesn't likes coffee.",
            "They doesn't like coffee.",
            "She doesn't like coffee.",
          ],
          correctAnswer: "She doesn't like coffee.",
          explanation:
            "'Doesn't' is used with third-person singular subjects, and the main verb stays in base form.",
        },
        {
          question: "What is the synonym of 'happy'?",
          options: ["Sad", "Angry", "Joyful", "Tired"],
          correctAnswer: "Joyful",
          explanation: "'Joyful' means feeling or expressing great happiness.",
        },
        {
          question: "What is the antonym of 'beneath'?",
          options: ["Under", "Below", "Above", "Underneath"],
          correctAnswer: "Above",
          explanation: "'Above' is the opposite of 'beneath' (meaning at a higher level).",
        },
        {
          question: "Which punctuation mark ends an interrogative sentence?",
          options: ["Period", "Exclamation mark", "Question mark", "Comma"],
          correctAnswer: "Question mark",
          explanation: "Interrogative sentences (questions) end with a question mark.",
        },
        {
          question: "What type of word connects two clauses?",
          options: ["Adjective", "Conjunction", "Adverb", "Preposition"],
          correctAnswer: "Conjunction",
          explanation:
            "Conjunctions like 'and,' 'but,' and 'or' connect words, phrases, or clauses.",
        },
        {
          question: "Identify the adverb: 'She sings beautifully.'",
          options: ["She", "sings", "beautifully", "None"],
          correctAnswer: "beautifully",
          explanation: "'Beautifully' modifies the verb 'sings,' describing how she sings.",
        },
        {
          question: "What is the plural of 'child'?",
          options: ["childs", "childes", "children", "childrent"],
          correctAnswer: "children",
          explanation: "'Child' has an irregular plural form: 'children.'",
        },
        {
          question: "Which is a complete sentence?",
          options: ["Running fast.", "The cat.", "She ran fast.", "Because she ran."],
          correctAnswer: "She ran fast.",
          explanation:
            "A complete sentence must have a subject and a verb and express a complete thought.",
        },
      ],
    },
  },
  {
    name: "History",
    description:
      "Journey through ancient civilizations, world wars, and the events that shaped our modern world.",
    imageUrl: "https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=400",
    lessons: [
      {
        title: "Ancient Civilizations",
        summary: "Discover the early societies that laid the foundation for modern culture.",
        content:
          "From Mesopotamia and Ancient Egypt to the Indus Valley and Shang Dynasty, early civilizations developed writing, law codes, and monumental architecture. This lesson explores their contributions.",
        videoUrl: "https://example.com/videos/ancient-civilizations.mp4",
        videoSize: "62.4 MB",
        videoHash: "a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2",
      },
      {
        title: "World War II Overview",
        summary: "Understand the causes, major events, and aftermath of WWII.",
        content:
          "World War II was a global conflict from 1939 to 1945 involving most of the world's nations. This lesson covers the rise of fascism, key battles, the Holocaust, and the war's lasting impact.",
        videoUrl: "https://example.com/videos/wwii-overview.mp4",
        videoSize: "71.6 MB",
        videoHash: "b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3",
      },
    ],
    practice: {
      title: "World History - Quiz",
      questions: [
        {
          question: "Which ancient civilization built the pyramids of Giza?",
          options: ["Mesopotamia", "Ancient Egypt", "Ancient Greece", "Roman Empire"],
          correctAnswer: "Ancient Egypt",
          explanation:
            "The Great Pyramids of Giza were built by the Ancient Egyptians around 2560 BCE.",
        },
        {
          question: "What year did World War II end?",
          options: ["1943", "1944", "1945", "1946"],
          correctAnswer: "1945",
          explanation:
            "World War II ended in 1945 after Germany surrendered in May and Japan surrendered in September.",
        },
        {
          question: "Who was the first President of the United States?",
          options: ["Thomas Jefferson", "John Adams", "George Washington", "Benjamin Franklin"],
          correctAnswer: "George Washington",
          explanation: "George Washington served as the first U.S. president from 1789 to 1797.",
        },
        {
          question: "What empire was ruled by Genghis Khan?",
          options: ["Ottoman Empire", "Mongol Empire", "Roman Empire", "Persian Empire"],
          correctAnswer: "Mongol Empire",
          explanation:
            "Genghis Khan founded the Mongol Empire, the largest contiguous land empire in history.",
        },
        {
          question: "What significant wall was built to protect ancient China?",
          options: ["Great Wall of China", "Berlin Wall", "Hadrian's Wall", "Western Wall"],
          correctAnswer: "Great Wall of China",
          explanation:
            "The Great Wall of China was built over centuries to protect Chinese states from invasions.",
        },
        {
          question: "Which European explorer reached the Americas in 1492?",
          options: [
            "Ferdinand Magellan",
            "Vasco da Gama",
            "Christopher Columbus",
            "Amerigo Vespucci",
          ],
          correctAnswer: "Christopher Columbus",
          explanation:
            "Columbus's 1492 voyage, sponsored by Spain, led to the first sustained European contact with the Americas.",
        },
        {
          question: "What ancient Greek city-state is known for its democracy?",
          options: ["Sparta", "Athens", "Corinth", "Thebes"],
          correctAnswer: "Athens",
          explanation:
            "Athens is often called the birthplace of democracy, where citizens could vote on laws directly.",
        },
        {
          question: "What war was fought between the North and South in the United States?",
          options: ["Revolutionary War", "War of 1812", "Civil War", "World War I"],
          correctAnswer: "Civil War",
          explanation:
            "The American Civil War (1861-1865) was fought between the Union (North) and the Confederacy (South).",
        },
        {
          question: "Which civilization invented the concept of zero in mathematics?",
          options: ["Romans", "Greeks", "Mayans", "Egyptians"],
          correctAnswer: "Mayans",
          explanation:
            "The Mayan civilization independently developed the concept of zero as a placeholder in their numeral system.",
        },
        {
          question: "What treaty ended World War I?",
          options: [
            "Treaty of Paris",
            "Treaty of Versailles",
            "Treaty of Ghent",
            "Treaty of Vienna",
          ],
          correctAnswer: "Treaty of Versailles",
          explanation:
            "The Treaty of Versailles, signed in 1919, officially ended World War I between Germany and the Allied Powers.",
        },
      ],
    },
  },
];

async function main() {
  console.log("Seeding database...");

  // Clean existing data in reverse dependency order
  await prisma.practice.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.course.deleteMany();
  await prisma.user.deleteMany();
  await prisma.manifest.deleteMany();
  await prisma.admin.deleteMany();

  // Seed Admin
  const hashedPassword = bcrypt.hashSync(ADMIN_PASSWORD, 10);
  await prisma.admin.create({
    data: {
      name: "System Admin",
      email: ADMIN_EMAIL,
      password: hashedPassword,
    },
  });
  console.log("  ✓ Admin seeded");

  // Seed Users
  await prisma.user.createMany({
    data: USERS.map((u) => ({
      name: u.name,
      class: u.class,
      school: u.school,
      guardianName: u.guardianName,
      guardianEmail: u.guardianEmail,
      guardianPhone: u.guardianPhone,
    })),
  });
  console.log("  ✓ Users seeded");

  // Seed Manifest
  await prisma.manifest.create({
    data: {
      name: "Innovatech App v1.0.0",
      version: "1.0.0",
      hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      url: "https://releases.innovatech.com/v1.0.0/innovatech.apk",
      appSize: "45.8 MB",
      innovaiModelTagName: "innovai-v1.0",
      innovaiModelSize: "256 MB",
      innovaiModelHash: "sha256-abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
      active: true,
    },
  });
  console.log("  ✓ Manifest seeded");

  // Seed Courses, Lessons, Practices
  for (const courseData of COURSES) {
    const { lessons, practice, ...courseFields } = courseData;

    const course = await prisma.course.create({
      data: courseFields,
    });

    await prisma.lesson.createMany({
      data: lessons.map((l) => ({
        courseId: course.id,
        title: l.title,
        summary: l.summary,
        content: l.content,
        videoUrl: l.videoUrl,
        videoSize: l.videoSize,
        videoHash: l.videoHash,
      })),
    });

    await prisma.practice.create({
      data: {
        courseId: course.id,
        title: practice.title,
        questions: practice.questions,
      },
    });

    console.log(`  ✓ Course "${course.name}" seeded with ${lessons.length} lessons and 1 practice`);
  }

  console.log("\nSeeding complete!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("Seeding failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
