export type FunLoungeCategory =
  | 'CODING'
  | 'COLLEGE'
  | 'EXAMS'
  | 'DEBUGGING'
  | 'AI_ML'
  | 'WEB_DEV'
  | 'DSA'
  | 'HOSTEL'
  | 'PLACEMENTS'
  | 'QUESTION';

export interface FunLoungeItem {
  id: string;
  text: string;
  category: FunLoungeCategory;
  isQuestion?: boolean;
}

export const FUN_LOUNGE_ITEMS: FunLoungeItem[] = [
  { id: 'fun-001', text: 'Code chal gaya? Bhai screenshot le, ye historic moment hai.', category: 'DEBUGGING' },
  { id: 'fun-002', text: 'Assignment kal submit hai aur laptop bol raha hai: update and restart.', category: 'COLLEGE' },
  { id: 'fun-003', text: 'DSA karte karte ab toh relationships bhi linked list jaisi lagti hain—ek node toota sab disconnected.', category: 'DSA' },
  { id: 'fun-004', text: 'Bug fix karne aaye the, teen naye bugs ko full-time internship de di.', category: 'DEBUGGING' },
  { id: 'fun-005', text: 'C++ mein semicolon bhool jao toh compiler tumhari aukaat yaad dila deta hai.', category: 'CODING' },
  { id: 'fun-006', text: 'Group project mein sabse active banda kaun? Jo presentation ke din font change karta hai.', category: 'COLLEGE' },
  { id: 'fun-007', text: 'AI itni smart ho gayi, phir bhi mera syntax error kyun nahi samajh rahi?', category: 'AI_ML' },
  { id: 'fun-008', text: 'Sach batao: tum code pehle likhte ho ya pehle ChatGPT se poochte ho?', category: 'QUESTION', isQuestion: true },
  { id: 'fun-009', text: 'Agar debugging ek sport hota, tum gold medal jeette ya bug ko hi feature bol dete?', category: 'QUESTION', isQuestion: true },
  { id: 'fun-010', text: 'Ek honest sawaal: tumhare laptop mein zyada storage hai ya pending assignments?', category: 'QUESTION', isQuestion: true },
  { id: 'fun-011', text: 'while (exam_near) { panic++; neend--; }', category: 'EXAMS' },
  { id: 'fun-012', text: 'Programmer ki favourite exercise? Error message ko screen ke 2cm paas aakar ghoorna.', category: 'CODING' },
  { id: 'fun-013', text: 'Code mein logic missing hai ya meri life ka direction?', category: 'DEBUGGING' },
  { id: 'fun-014', text: 'Placement preparation: LinkedIn pe motivated, LeetCode pe humbled.', category: 'PLACEMENTS' },
  { id: 'fun-015', text: 'Aaj ka sawaal: code compile ho gaya lekin samajh nahi aaya—ye success hai ya suspense?', category: 'QUESTION', isQuestion: true },
  { id: 'fun-016', text: 'Hostel ka Wi-Fi aur attendance: dono tabhi gayab hote hain jab sabse zyada zaroorat ho.', category: 'HOSTEL' },
  { id: 'fun-017', text: "Git commit message at 11 PM: 'minor fix'. At 3 AM: 'bhagwan bharose'.", category: 'CODING' },
  { id: 'fun-018', text: 'CSS center karne mein utna time lag gaya jitna pura backend likhne mein.', category: 'WEB_DEV' },
  { id: 'fun-019', text: "Professor: 'Copy mat karna.' Student: 'Sir logic alag hai, variable name x se y kar diya.'", category: 'COLLEGE' },
  { id: 'fun-020', text: 'Engineering mein 75% attendance maintain karna DSA ke Hard question se bhi mushkil hai.', category: 'COLLEGE' },
  { id: 'fun-021', text: 'Stack Overflow down ho jaye toh 90% software industry emergency holiday declare kar degi.', category: 'CODING' },
  { id: 'fun-022', text: 'Recursion samajhne ke liye pehle recursion samajhna padega... infinite loop activated.', category: 'DSA' },
  { id: 'fun-023', text: "Placement drive mein HR: 'Where do you see yourself in 5 years?' Me: 'Somewhere with a working production build.'", category: 'PLACEMENTS' },
  { id: 'fun-024', text: 'Exam hall mein question paper dekh ke lagta hai syllabus mere batch ke liye nahi tha.', category: 'EXAMS' },
  { id: 'fun-025', text: "Python: 'Tum semicolon bhool gaye? Koi baat nahi dost.' C++: 'Segfault. Core dumped.'", category: 'CODING' },
  { id: 'fun-026', text: "Dost kehta hai: 'Bhai tu code likh, main documentation likhunga.' Translation: Main popcorn khaunga.", category: 'COLLEGE' },
  { id: 'fun-027', text: 'Kya tumhare browser mein 47 tabs khule hain jisme se 40 Stack Overflow ke hain?', category: 'QUESTION', isQuestion: true },
  { id: 'fun-028', text: 'Machine Learning model ka 99% accuracy aaya... par validation test pe overfit hoke ro raha hai.', category: 'AI_ML' },
  { id: 'fun-029', text: 'Hostel mess ka khana aur legacy codebase: dono mein pata nahi chalta andar kya mila hua hai.', category: 'HOSTEL' },
  { id: 'fun-030', text: 'Ek warning thi, maine ignore kar di. Ab server pe fireworks chal rahe hain.', category: 'DEBUGGING' },
  { id: 'fun-031', text: "Frontend developer: 'Mere system pe chal raha tha.' Client: 'Tumhara system toh customer ke paas nahi hai na?'", category: 'WEB_DEV' },
  { id: 'fun-032', text: 'Binary Search toh theek hai, par engineering life mein peace of mind search nahi ho raha.', category: 'DSA' },
  { id: 'fun-033', text: "Resume pe likha: 'Expert in Python'. Reality: print('hello world') ke baad Google search.", category: 'PLACEMENTS' },
  { id: 'fun-034', text: 'Subah 9 baje ka lecture aur 8:59 ka alarm—engineering life ka ultimate high-stakes race.', category: 'COLLEGE' },
  { id: 'fun-035', text: 'Agar light mode IDE use karte ho toh kya sach mein aankhein steel se bani hain?', category: 'QUESTION', isQuestion: true },
  { id: 'fun-036', text: 'Prompt engineering bol kar dost ko homework karwana nayi superpower hai.', category: 'AI_ML' },
  { id: 'fun-037', text: "Viva examiner: 'Inheritance kya hota hai?' Student: 'Sir jo baap-dada se milta hai.' Examiner: 'Beta agle saal milna.'", category: 'EXAMS' },
  { id: 'fun-038', text: 'Localhost pe sab king hain, deployment ke time sab praying mode mein aate hain.', category: 'WEB_DEV' },
  { id: 'fun-039', text: 'Hostel room ka rule: room mein jo sabse pehle soye, subah uski chai sabse pehle gayab.', category: 'HOSTEL' },
  { id: 'fun-040', text: 'Git rebase karte time darr lagta hai ki pura company ka repo drop na ho jaye.', category: 'CODING' },
  { id: 'fun-041', text: 'Time Complexity: O(1) < O(log n) < O(n) < O(n!) < Time taken to decide kya pehnu interview mein.', category: 'DSA' },
  { id: 'fun-042', text: 'Chai + Maggi + Dark Mode IDE = Engineering ka official survival kit.', category: 'HOSTEL' },
  { id: 'fun-043', text: 'Tumhara code review dekh ke senior developer ne deep sigh li... samajh jao re-write hone wala hai.', category: 'CODING' },
  { id: 'fun-044', text: 'Question: Agar coding language ek insaan hoti, sabse toxic ex kaunsi hoti?', category: 'QUESTION', isQuestion: true },
  { id: 'fun-045', text: 'AI coding agents code likh rahe hain, par client ki illogical requirements kaise jhelenge?', category: 'AI_ML' },
  { id: 'fun-046', text: 'Internship stipend aayi: aadha party mein gaya, aadha cloud hosting ke unpaid bills mein.', category: 'PLACEMENTS' },
  { id: 'fun-047', text: 'Exam se ek raat pehle One-Shot lecture 2x speed pe dekhne ka ghamand hai.', category: 'EXAMS' },
  { id: 'fun-048', text: 'Div ko horizontally aur vertically center karna engineering ki sabse badi unsolved mystery hai.', category: 'WEB_DEV' },
  { id: 'fun-049', text: 'Dynamic Programming ka optimal subproblem mil gaya par life ka optimal routine nahi mila.', category: 'DSA' },
  { id: 'fun-050', text: 'Hostel ka ceiling fan 200 RPM pe chalta hai aur awaz Boeing 747 jaisi nikalta hai.', category: 'HOSTEL' },
  { id: 'fun-051', text: '// Comment in code: Do not touch this line, bhagwan jaane kaise chal raha hai.', category: 'DEBUGGING' },
  { id: 'fun-052', text: "HR: 'What is your greatest weakness?' Candidate: 'Off-by-one errors and extreme caffeine dependence.'", category: 'PLACEMENTS' },
  { id: 'fun-053', text: "Class topper: 'Bhai maine toh kuch nahi padha.' Also topper: Scores 99/100.", category: 'COLLEGE' },
  { id: 'fun-054', text: 'Sawaal: Kya tumne kabhi production database drop karne ka darr mehsoos kiya hai?', category: 'QUESTION', isQuestion: true },
  { id: 'fun-055', text: 'Neural network train ho raha hai... fan itna tez chal raha hai laptop abhi takeoff karega.', category: 'AI_ML' },
  { id: 'fun-056', text: 'Engineering drawing ki sheet sheet kam, torture tool zyada lagti thi.', category: 'COLLEGE' },
  { id: 'fun-057', text: 'Production bug at Friday 5:59 PM is the universe testing your mental stability.', category: 'DEBUGGING' },
  { id: 'fun-058', text: 'npm install karte hi 500 MB ka node_modules download ho gaya... black hole se bhi bhari.', category: 'WEB_DEV' },
  { id: 'fun-059', text: 'Two Pointer technique relationships mein lagao toh dono alag directions mein nikal jaate hain.', category: 'DSA' },
  { id: 'fun-060', text: 'Hostel night outs: 10% padhai, 90% philosophy aur midnight paratha hunting.', category: 'HOSTEL' },
  { id: 'fun-061', text: "Placement aptitude test: 'Train A meets Train B...' Bhai dono trains cancel karwa do please.", category: 'PLACEMENTS' },
  { id: 'fun-062', text: 'Exam mein 2 mark ke question ke liye 2 page bharne ka talent sirf engineers ke paas hai.', category: 'EXAMS' },
  { id: 'fun-063', text: "Java developers: 'Hum verbose nahi hain, hum har baat respectfully detail mein kehte hain.'", category: 'CODING' },
  { id: 'fun-064', text: 'Sawaal: Tumhara code sabse zyada kis time productive hota hai: Subah 6 baje ya Raat 2 baje?', category: 'QUESTION', isQuestion: true },
  { id: 'fun-065', text: "LLM se summary maangi thi, usne 'In this fast-paced world...' likh ke gyaan de diya.", category: 'AI_ML' },
  { id: 'fun-066', text: 'Responsive design test kiya: Mobile screen pe submit button out of coverage area chala gaya.', category: 'WEB_DEV' },
  { id: 'fun-067', text: 'Dijkstra algorithm shortest path dhoond leta hai, par canteen ki line ka shortcut kaun batayega?', category: 'DSA' },
  { id: 'fun-068', text: "Prof: 'Surprise quiz!' Entire class internally: 'Hamari existence hi ek surprise hai sir.'", category: 'EXAMS' },
  { id: 'fun-069', text: 'Git stash pop kiya aur 34 merge conflicts ne welcome garland pehna di.', category: 'CODING' },
  { id: 'fun-070', text: 'Hostel roommate ka alarm subah 6 baje baje, poora floor jaag jaye par wo khud peaceful sota rahe.', category: 'HOSTEL' },
  { id: 'fun-071', text: "Off-campus job portal status: 'Application submitted'... since early 2022.", category: 'PLACEMENTS' },
  { id: 'fun-072', text: "console.log('yahan tak chala 123') is the international gold standard of debugging.", category: 'DEBUGGING' },
  { id: 'fun-073', text: 'College fest committee: Padhai chod ke sab karenge, budget 500 rupaye aur sapne international DJ ke.', category: 'COLLEGE' },
  { id: 'fun-074', text: 'Sawaal: Kya tum bina kisi error ke code first try mein run hone par suspicious ho jaate ho?', category: 'QUESTION', isQuestion: true },
  { id: 'fun-075', text: "AI bolti hai: 'As an AI language model...' Bhai mujhe seedha answer de, lecture mat de.", category: 'AI_ML' },
  { id: 'fun-076', text: 'Graph traversal karte karte cycle detect ho gayi... bilkul mere toxic sleep schedule ki tarah.', category: 'DSA' },
  { id: 'fun-077', text: "'HTML is a programming language' bolne walo ke liye Garud Puran mein alag saza hai.", category: 'WEB_DEV' },
  { id: 'fun-078', text: 'Semester exam start hone mein 12 ghante bache hain aur group chat pe stickers exchange ho rahe hain.', category: 'EXAMS' },
  { id: 'fun-079', text: "LinkedIn connections badhane ka contest: 'Humbled and thrilled to announce I drank water today.'", category: 'PLACEMENTS' },
  { id: 'fun-080', text: 'Coffee is an engineering tool that converts caffeine into questionable 3 AM commits.', category: 'CODING' },
  { id: 'fun-081', text: 'Hostel water cooler: Thande paani ki jagah lukewarm disappointment supply karta hai.', category: 'HOSTEL' },
  { id: 'fun-082', text: 'Code tabhi fail hota hai jab screen professor ya client ko share hoti hai. Fact.', category: 'DEBUGGING' },
  { id: 'fun-083', text: 'Lab evaluation: External examiner ne bas enter press kiya aur poora terminal red ho gaya.', category: 'COLLEGE' },
  { id: 'fun-084', text: 'Sawaal: Agar tumhe coding ki memory wipe karke koi ek DSA topic bhulana ho, kaunsa bhulaoge?', category: 'QUESTION', isQuestion: true },
  { id: 'fun-085', text: 'Autonomous cars AI se chal rahi hain aur mera ML model cat aur dog mein confuse ho raha hai.', category: 'AI_ML' },
  { id: 'fun-086', text: 'Z-index: 99999999 de diya, phir bhi modal dropdown ke peeche chup gaya.', category: 'WEB_DEV' },
  { id: 'fun-087', text: 'Sliding Window problem solve karte karte room ki window se bahar dekh ke rona aa gaya.', category: 'DSA' },
  { id: 'fun-088', text: "Exam invigilator: '5 minutes remaining!' Pen ki speed light ki speed ko surpass kar deti hai.", category: 'EXAMS' },
  { id: 'fun-089', text: 'Placement season: Dost ka offer sunkar khushi hui... 2 second ke liye, phir existential crisis.', category: 'PLACEMENTS' },
  { id: 'fun-090', text: 'Delete branch karne se pehle 5 baar verify karne ka trauma sab real coders ko hota hai.', category: 'CODING' },
  { id: 'fun-091', text: 'Hostel laundry bag: Ek bar kapde andar gaye toh semester ke end mein hi nikalte hain.', category: 'HOSTEL' },
  { id: 'fun-092', text: 'Undefined is not a function: JavaScript ka sabse famous dialogue.', category: 'DEBUGGING' },
  { id: 'fun-093', text: 'College attendance portal ka server exam form bharte waqt crash hona official protocol hai.', category: 'COLLEGE' },
  { id: 'fun-094', text: 'Sawaal: Sincere answer dena: Ek din mein sabse zyada chai ya coffee kitni pi hai?', category: 'QUESTION', isQuestion: true },
  { id: 'fun-095', text: 'GPU temperature 95°C: Deep learning model bhi train ho gaya aur upar omelette bhi ban gaya.', category: 'AI_ML' },
  { id: 'fun-096', text: "Frontend: 'Desktop pe pixel perfect hai.' Mobile viewport: 'Main to toot ke bikhar gaya.'", category: 'WEB_DEV' },
  { id: 'fun-097', text: 'Trie data structure prefix search ke liye best hai, aur interview mein blank out hone ke liye bhi.', category: 'DSA' },
  { id: 'fun-098', text: 'Internal marks aane ke baad sabse khadoos professor bhi achanak devta lagne lagte hain.', category: 'COLLEGE' },
  { id: 'fun-099', text: 'Engineering ka sabse bada sach: Degree 4 saal mein milti hai, par yaar life-time ke milte hain.', category: 'COLLEGE' },
  { id: 'fun-100', text: 'Sawaal: Code likhte waqt background mein: lofi beats, full volume metal, ya completely dead silence?', category: 'QUESTION', isQuestion: true },
];

export const FUN_LOUNGE_REACTIONS = ['👍', '❤️', '😂', '💡', '🚀', '🔥'] as const;
export type FunReactionEmoji = typeof FUN_LOUNGE_REACTIONS[number];
