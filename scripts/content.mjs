// Realistic placeholder content (invented, school-paper voice). Replaces the lorem generator.
import { writeFileSync } from 'node:fs';
const crew = [
  { name: 'Brent Bullis', title: 'Editor-in-Chief', role: 'editor', blurb: '' },
  { name: 'Benjamin Giles', title: 'Staff Writer', role: 'staff', blurb: '' },
  { name: 'Kolbe Berend', title: 'Staff Writer', role: 'staff', blurb: '' },
  { name: 'Rajvi Rangari', title: 'Staff Writer', role: 'staff', blurb: '' },
  { name: 'Claire Deville', title: 'Staff Writer', role: 'staff', blurb: '' },
];
const P = (...ps) => ps.join('\n\n');
const stories = [
  { id: 'lead', section: 'Sports', byline: 'Kolbe Berend',
    title: 'Dragons open district play Friday under new lights at Dragon Stadium',
    dek: 'A summer-long lighting overhaul is finished, and the first home district game will be the first time most students see it switched on.',
    bodyMd: P(
      'The lights at Dragon Stadium have been dark since May. On Friday night they come back on, and they are not the same lights.',
      'Over the summer the district replaced the stadium\'s original halide fixtures with LED arrays on all four poles, part of a facilities project that also resurfaced the track and rebuilt the north bleacher ramps. Athletic director Curtis Hale said the new system reaches full brightness in seconds instead of minutes and can be dimmed between quarters. "You will notice it the first time the band takes the field," Hale said. "The old lights had a yellow cast. This is closer to daylight."',
      '> "You will notice it the first time the band takes the field."',
      'The football team enters district play after a 2-1 non-district stretch that included a road win in overtime. Head coach Dana Whitfield said the offense spent the bye week on tempo. "We were leaving plays on the field in the second half," Whitfield said. "The fix is conditioning and communication, not a new playbook."',
      '## What to know Friday',
      'Gates open at 6 p.m. and kickoff is at 7:30. Student tickets are free with an ID at the Dragon Nation table on the home side; visitors pay at the gate. The band performs its full show at halftime for the first time this season, and the senior class will be recognized before the anthem. Parking on Deep Wood Drive fills by 6:30, so the district is running shuttles from the practice lots.',
      'The Dragons have won their district opener in each of the past three seasons. Whether that streak continues, Friday is the night the stadium finally looks the way it was meant to.'
    ) },
  { id: 's2', section: 'News', byline: 'Rajvi Rangari',
    title: 'New parking permit system goes live Monday, and the old hang tags stop working',
    dek: 'Student drivers now register plates online. The school says lines at the front office should disappear; students say they will believe it when they see it.',
    bodyMd: P(
      'Starting Monday, the yellow hang tags that have dangled from rear-view mirrors for as long as anyone can remember are officially retired. In their place is a plate-based permit system that the front office says will take five minutes to set up and zero minutes to renew.',
      'Students register their license plate through the Home Access Center portal, upload proof of insurance and a driver\'s license, and pay the same $40 fee as last year. Assistant principal Lorraine Mbeki said the change was driven by one number. "We processed 1,900 permits last August by hand," Mbeki said. "That is a line out the door for two weeks. Nobody wants that, least of all the people standing in it."',
      'Enforcement will be done by a plate reader on the golf cart that patrols the student lots. Cars without a registered plate get a warning on the first pass and a citation on the second.',
      '## The catch',
      'Students who share a car with a sibling or drive a parent\'s vehicle some days will need to register each plate, up to three per permit. Anyone who changes cars mid-year has to update the portal before parking. "The system only knows what you tell it," Mbeki said.',
      'Senior lot assignments are unchanged. Juniors remain in the Deep Wood lot, and the overflow lot behind the tennis courts opens once the main lots fill.'
    ) },
  { id: 's3', section: 'Academics', byline: 'Benjamin Giles',
    title: 'AP exam registration opens next week with an earlier deadline than last year',
    dek: 'The College Board moved the fall ordering window up. Miss it and the late fee is $40 per exam.',
    bodyMd: P(
      'Registration for May\'s AP exams opens Monday and closes Oct. 31, two weeks earlier than last year. Counselor Anita Delgado said the change comes from the College Board, not the school, and there is no wiggle room. "The order goes in on Nov. 1 whether your name is on it or not," she said.',
      'Students register through the AP Classroom join codes their teachers hand out the first week, then confirm the exam order in the counseling office. The fee is $98 per exam, with a reduced fee of $53 for students on free or reduced lunch. Late registration runs through March with a $40 penalty per exam, and cancellations after Nov. 1 forfeit $40.',
      '> "The order goes in on Nov. 1 whether your name is on it or not."',
      'Delgado said the most common mistake is assuming that enrolling in an AP class registers you for the exam. It does not. "Every year I have a senior who finds out in April," she said. "Do not be that senior."',
      '## Study sessions start early',
      'The National Honor Society is running free Saturday review sessions in the library beginning in January, one subject per week. A sign-up sheet is posted outside room B214.'
    ) },
  { id: 's4', section: 'Clubs', byline: 'Benjamin Giles',
    title: 'Robotics team starts over with a new drivetrain and a younger roster',
    dek: 'After graduating seven seniors, Dragon Robotics is rebuilding from the wheels up ahead of the regional qualifier in November.',
    bodyMd: P(
      'The robot that took Dragon Robotics to state last spring is sitting in pieces on a workbench in the engineering wing. That is on purpose.',
      '"We stripped it to the chassis," team captain Lena Okafor said. "Half the people who built it graduated. If the new members do not build this one, they will not be able to fix it when it breaks at competition. And it will break."',
      'The team has 31 members this year, 19 of them new. Meetings run Tuesday and Thursday after school and most Saturday mornings once the game reveal drops in October. The first regional qualifier is in November.',
      '## What is different',
      'The biggest change is a swerve drivetrain, which lets the robot move in any direction without turning first. It is faster and far harder to program. Sophomore Aiden Park is leading the software group. "Last year I was the person handing people zip ties," Park said. "This year I am the reason the robot drives into a wall. It is a promotion."',
      'The team is also fundraising for a second competition entry fee. A parts drive runs through the end of the month; a list of what they need is posted on the club board outside the shop.'
    ) },
  { id: 's5', section: 'Arts', byline: 'Claire Deville',
    title: 'Theatre picks "Our Town" for the fall play, and auditions are open to everyone',
    dek: 'Director Sam Whitaker wants a cast that looks like the school. No experience required, but bring a monologue.',
    bodyMd: P(
      'Dragon Theatre will stage Thornton Wilder\'s "Our Town" this November, the department announced Tuesday. It is the first time the school has produced the play in more than a decade.',
      'Director Sam Whitaker said the choice was practical and personal. "It is a play about a small town watching itself grow up," Whitaker said. "That is this school. Also, the set is four chairs and a ladder, which helps."',
      'Auditions are Sept. 16 and 17 after school in the black box. Students should prepare a one-minute monologue; sides from the script will be available at the door for anyone who does not have one. Callbacks are Sept. 19.',
      '> "The set is four chairs and a ladder, which helps."',
      '## Crew needs people too',
      'Technical theatre is recruiting for lights, sound, costumes and stage management. No audition, just show up to the crew interest meeting on Sept. 18. Performances are Nov. 13 through 15 in the Performing Arts Center. Tickets go on sale in October.'
    ) },
  { id: 's6', section: 'Opinion', byline: 'Rajvi Rangari',
    title: 'Opinion: five minutes is not a passing period, it is a sprint',
    dek: 'The campus is a quarter mile end to end. The bell schedule pretends it is not.',
    bodyMd: P(
      'Walk from the band hall to the science wing. Take the stairs, because the elevator is for people with a pass. Stop at your locker if you are brave. Now do it in five minutes with 3,900 other people going the other way.',
      'That is the passing period at Round Rock High School, and it is not enough. Last year the schedule trimmed it from seven minutes to five to add instructional time. The extra two minutes per class add up to a little under fifteen minutes a day. That sounds like a lot until you watch a freshman jog past the library with a trombone case.',
      '> Nobody learns anything in the first two minutes of class while a third of the room is still walking in.',
      'The honest math is that nobody learns anything in the first two minutes of class while a third of the room is still walking in. Teachers wait. Tardies pile up. The time we "gained" is spent taking attendance twice.',
      '## A modest ask',
      'Give us seven minutes back, or six, or five plus a rule that says nobody is tardy if they are inside the building. Other 6A campuses in the district run six and seven minutes. Ours is the biggest building. It should have the longest walk.',
      'This is the opinion of the writer and not of Dragon News or Round Rock High School.'
    ) },
  { id: 's7', section: 'Dragon Life', byline: 'Claire Deville',
    title: 'Homecoming week: the dress-up days, the parade route and where to be Friday',
    dek: 'Student Council released the schedule. Here is the whole week on one page.',
    bodyMd: P(
      'Homecoming week runs Oct. 6 through 10. Student Council published the full schedule Wednesday, and the short version is: dress up every day, be in the courtyard at lunch, and do not park on Main Street Friday afternoon.',
      '## Dress-up days',
      '- Monday: Pajama Day\n- Tuesday: Decades Day (pick one, commit)\n- Wednesday: Twin Day\n- Thursday: Class Colors (freshmen white, sophomores gray, juniors black, seniors maroon)\n- Friday: Dragon Pride, maroon and white everything',
      'Lunch activities in the courtyard include the annual tug-of-war between classes on Wednesday and the teacher lip-sync on Thursday, which Student Council president Nadia Brooks described as "not to be missed, mostly for the wrong reasons."',
      '## Parade and game',
      'The parade steps off from the Deep Wood parking lot at 4:30 p.m. Friday and loops through downtown Round Rock before returning to the stadium. Clubs building floats should have them in the lot by 3:45. The homecoming court is announced at halftime of the game. The dance is Saturday in the main gym from 8 to 11 p.m.; tickets are $15 in advance and $20 at the door.'
    ) },
  { id: 's8', section: 'Sports', byline: 'Kolbe Berend',
    title: 'Volleyball\'s freshman setter is already running the offense',
    dek: 'Coaches did not expect to start a ninth-grader at setter. Then they watched her practice.',
    bodyMd: P(
      'Ask the varsity volleyball team who calls the plays and every hitter points at the shortest person on the floor. Freshman setter Ava Lindqvist has started every set since the second tournament of the season, a decision head coach Marisol Reyes said she did not plan to make until October.',
      '"You do not hand a varsity offense to a freshman because she is talented," Reyes said. "You do it because the seniors trust her. That happened faster than I have ever seen."',
      'Lindqvist played two years of club ball before high school and spent the summer in the gym with the returning hitters. Senior outside hitter Camille Ortiz said the difference is where the ball ends up. "She puts it in the same spot every time," Ortiz said. "You stop thinking and just swing."',
      '> "You stop thinking and just swing."',
      '## The stretch ahead',
      'The Dragons open the second half of district play at home Tuesday. Reyes said the goal is simple. "Serve tough, pass clean, and let Ava do the rest," she said. Lindqvist, asked about the pressure, shrugged. "I just have to get it to the hitters," she said. "They do the hard part."'
    ) },
];
// Covers are self-hosted in public/img/covers so no third-party host can break the page.
import { readFileSync } from 'node:fs';
const credits = JSON.parse(readFileSync(new URL('../src/data/photo-credits.json', import.meta.url), 'utf8'));
const out = stories.map((s) => ({ ...s, cover: `/img/covers/${s.id}.jpg`, thumb: `/img/covers/${s.id}-t.jpg`, coverCredit: credits[s.id]?.credit || 'Dragon News file photo' }));
const order = ['News', 'Sports', 'Academics', 'Clubs', 'Arts', 'Opinion', 'Dragon Life'];
const edition = { id: '2026-09-05', date: '2026-09-05', status: 'published', lead: 'lead', sections: order.map((name) => ({ name, storyIds: out.filter((s) => s.section === name && s.id !== 'lead').map((s) => s.id) })).filter((s) => s.storyIds.length), stories: out, placeholder: false };
writeFileSync(new URL('../src/data/sample-edition.json', import.meta.url), JSON.stringify(edition, null, 2));
writeFileSync(new URL('../src/data/crew.json', import.meta.url), JSON.stringify({ members: crew, placeholder: false }, null, 2));
console.log('wrote', out.length, 'stories,', crew.length, 'crew');
