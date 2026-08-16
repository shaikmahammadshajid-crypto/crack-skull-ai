export interface TopicKnowledge {
  title: string;
  definition: string;
  keypoints: string[];
  examKeywords: string[];
  idealAnswer: string;
  commonMistakes: string[];
  vivaQuestions: string[];
}

const topicPacks: Array<{ patterns: RegExp[]; data: TopicKnowledge }> = [
  {
    patterns: [/acid/i, /transaction/i],
    data: {
      title: 'ACID Properties in DBMS',
      definition: 'ACID is a set of transaction properties that ensures database reliability: Atomicity, Consistency, Isolation, and Durability.',
      keypoints: [
        'Atomicity means all operations in a transaction happen completely or none happen.',
        'Consistency preserves integrity constraints before and after the transaction.',
        'Isolation ensures concurrent transactions do not interfere with each other.',
        'Durability guarantees committed changes survive crashes.',
      ],
      examKeywords: ['Atomicity', 'Consistency', 'Isolation', 'Durability', 'commit', 'rollback', 'concurrency', 'recovery'],
      idealAnswer: 'ACID properties guarantee reliable database transactions. Atomicity gives all-or-nothing execution, Consistency preserves constraints, Isolation makes concurrent transactions behave like serial execution, and Durability ensures committed data survives failures. In a bank transfer, debit and credit must both complete; otherwise rollback restores the original state.',
      commonMistakes: ['Forgetting rollback in Atomicity', 'Confusing Isolation with Durability', 'Not giving a real transaction example'],
      vivaQuestions: [
        'What does Atomicity mean in a banking transaction?',
        'How is Isolation different from Consistency?',
        'Why is Durability needed after commit?',
        'What happens if a crash occurs after debit but before credit?',
      ],
    },
  },
  {
    patterns: [/normalization/i, /bcnf/i, /3nf/i, /functional dependency/i],
    data: {
      title: 'Normalization and BCNF',
      definition: 'Normalization is the process of organizing relational tables to reduce redundancy and avoid update, insert, and delete anomalies.',
      keypoints: [
        '1NF requires atomic values and no repeating groups.',
        '2NF removes partial dependency on a composite key.',
        '3NF removes transitive dependency between non-key attributes.',
        'BCNF requires every determinant to be a superkey.',
      ],
      examKeywords: ['functional dependency', 'candidate key', 'closure', 'partial dependency', 'transitive dependency', 'superkey', 'lossless decomposition'],
      idealAnswer: 'Normalization decomposes relations to reduce redundancy and anomalies. After finding functional dependencies and candidate keys using closure, each dependency is checked against normal form rules. BCNF is stricter than 3NF because for every non-trivial dependency X -> Y, X must be a superkey. Decomposition should preserve lossless join and preferably dependency preservation.',
      commonMistakes: ['Skipping candidate key closure', 'Calling every 3NF relation BCNF', 'Decomposing without checking lossless join'],
      vivaQuestions: [
        'Why do we need normalization?',
        'How do you find candidate keys using closure?',
        'What is the difference between 3NF and BCNF?',
        'What is lossless join decomposition?',
      ],
    },
  },
  {
    patterns: [/2pl/i, /two phase locking/i, /serializability/i, /concurrency control/i, /strict 2pl/i],
    data: {
      title: 'Two-Phase Locking and Serializability',
      definition: 'Two-Phase Locking is a concurrency control protocol where a transaction first acquires locks and then releases locks, guaranteeing conflict serializability.',
      keypoints: [
        'Growing phase allows acquiring locks but not releasing them.',
        'Shrinking phase allows releasing locks but not acquiring new locks.',
        'Strict 2PL holds exclusive locks until commit or abort.',
        '2PL guarantees serializability but does not eliminate deadlocks.',
      ],
      examKeywords: ['growing phase', 'shrinking phase', 'shared lock', 'exclusive lock', 'conflict serializability', 'strict 2PL', 'deadlock'],
      idealAnswer: 'Two-Phase Locking has a growing phase where locks are acquired and a shrinking phase where locks are released. This ordering guarantees conflict serializability. Strict 2PL improves recoverability by holding write locks until commit or abort, but deadlock can still occur if transactions wait cyclically.',
      commonMistakes: ['Saying 2PL prevents all deadlocks', 'Not explaining two phases', 'Forgetting strict 2PL recoverability benefit'],
      vivaQuestions: [
        'What are the two phases in 2PL?',
        'Does 2PL prevent deadlock? Why?',
        'How is strict 2PL different from basic 2PL?',
        'Why does 2PL guarantee conflict serializability?',
      ],
    },
  },
  {
    patterns: [/deadlock/i, /banker/i],
    data: {
      title: 'Deadlock and Banker Algorithm',
      definition: 'Deadlock is a state where processes wait indefinitely because each process holds a resource needed by another process.',
      keypoints: [
        'Deadlock requires mutual exclusion, hold and wait, no preemption, and circular wait.',
        'Prevention breaks one necessary condition.',
        'Avoidance uses safe-state checks such as Banker algorithm.',
        'Detection finds cycles and recovery kills or rolls back processes.',
      ],
      examKeywords: ['mutual exclusion', 'hold and wait', 'no preemption', 'circular wait', 'safe state', 'available', 'need', 'allocation'],
      idealAnswer: 'A deadlock occurs when processes wait forever in a circular dependency. It needs four conditions: mutual exclusion, hold and wait, no preemption, and circular wait. Banker algorithm avoids deadlock by granting a request only if the system remains in a safe state with at least one safe sequence.',
      commonMistakes: ['Not listing all four conditions', 'Confusing prevention and avoidance', 'Skipping safe sequence in Banker problems'],
      vivaQuestions: [
        'What are the four necessary conditions for deadlock?',
        'How does Banker algorithm avoid deadlock?',
        'What is a safe state?',
        'Difference between deadlock prevention and avoidance?',
      ],
    },
  },
  {
    patterns: [/binary search/i],
    data: {
      title: 'Binary Search',
      definition: 'Binary search is a divide-and-conquer algorithm that searches a sorted array by repeatedly halving the search space.',
      keypoints: [
        'The input must be sorted.',
        'Compare the target with the middle element.',
        'Discard the half where the target cannot exist.',
        'Time complexity is O(log n), iterative space complexity is O(1).',
      ],
      examKeywords: ['sorted array', 'middle element', 'divide and conquer', 'O(log n)', 'low', 'high', 'overflow-safe mid'],
      idealAnswer: 'Binary search works on a sorted array. It compares the target with the middle element; if equal, it returns the index, if smaller it searches the left half, otherwise the right half. It repeats until found or the range becomes empty. Its time complexity is O(log n) and iterative space complexity is O(1).',
      commonMistakes: ['Forgetting sorted-array precondition', 'Using unsafe mid formula in C/Java', 'Wrong loop condition'],
      vivaQuestions: [
        'Why must the array be sorted for binary search?',
        'What is the time complexity and why?',
        'How do you avoid integer overflow while calculating mid?',
        'When does binary search fail?',
      ],
    },
  },
];

export function findTopicKnowledge(input = '', subject = ''): TopicKnowledge {
  const text = `${input} ${subject}`;
  const found = topicPacks.find(pack => pack.patterns.some(pattern => pattern.test(text)));
  if (found) return found.data;

  const title = input.trim() || subject || 'Selected Academic Topic';
  return {
    title,
    definition: `${title} is an academic concept that should be answered through definition, working principle, example, and exam relevance.`,
    keypoints: [
      `Define ${title} precisely.`,
      'Explain the working principle or process.',
      'Add a real-world or numerical example.',
      'Mention advantages, limitations, and exam keywords.',
    ],
    examKeywords: ['definition', 'principle', 'example', 'advantages', 'limitations', 'application'],
    idealAnswer: `A strong university answer for ${title} starts with a precise definition, explains the core working steps, includes an example, and ends with applications or limitations. Use standard terminology and avoid vague one-line responses.`,
    commonMistakes: ['Writing vague definitions', 'Missing examples', 'Not using standard technical terms'],
    vivaQuestions: [
      `Define ${title} in one sentence.`,
      `Why is ${title} important?`,
      `Give one real-world example of ${title}.`,
      `What is one limitation or common mistake in ${title}?`,
    ],
  };
}
