/* =========================================================
   data.js - Sample data used across the website
   (Events, Members, News, Gallery, FAQ)
   ========================================================= */

const EVENTS = [
  {
    id: 1, title: "AI & Machine Learning Workshop", category: "Workshop",
    date: "2026-12-10", time: "10:00 AM - 2:00 PM", location: "Lab 3, IT Building",
    icon: "fa-robot", cover: "cover-1", seats: 40, registered: 28,
    speaker: "Dr. Ashraf Abdelaziz",
    short: "Hands-on introduction to machine learning using Python and real datasets.",
    description: "Join us for a practical workshop where you will build your first machine learning model from scratch. We will cover data preparation, training, evaluation and deploying a simple prediction app. Bring your laptop with Python installed.",
    agenda: ["Intro to AI concepts", "Working with datasets in Python", "Training a classification model", "Mini project & Q&A"]
  },
  {
    id: 2, title: "Web Development Hackathon", category: "Competition",
    date: "2026-12-20", time: "9:00 AM - 9:00 PM", location: "Main Hall",
    icon: "fa-code", cover: "cover-2", seats: 60, registered: 51,
    speaker: "Club Technical Committee",
    short: "12-hour hackathon: build a full website in teams and win amazing prizes.",
    description: "Teams of up to 4 students will compete to design and build a complete, responsive website around a surprise theme. Mentors will be available all day, and the top 3 teams will receive prizes and certificates.",
    agenda: ["Theme announcement", "Team building session", "Mentor checkpoints", "Final presentations & awards"]
  },
  {
    id: 3, title: "Cybersecurity Awareness Seminar", category: "Seminar",
    date: "2027-01-08", time: "12:00 PM - 2:00 PM", location: "Auditorium A",
    icon: "fa-shield-halved", cover: "cover-4", seats: 120, registered: 64,
    speaker: "Eng. Mona Hassan",
    short: "Learn how to protect your accounts and data from common cyber attacks.",
    description: "A seminar covering phishing, password security, social engineering and safe browsing habits. Includes a live demo of how attackers exploit weak passwords and how to defend against them.",
    agenda: ["Threat landscape overview", "Live phishing demo", "Password & 2FA best practices", "Open discussion"]
  },
  {
    id: 4, title: "Career Day: Tech Companies Meetup", category: "Networking",
    date: "2027-01-22", time: "11:00 AM - 4:00 PM", location: "University Garden",
    icon: "fa-briefcase", cover: "cover-3", seats: 200, registered: 132,
    speaker: "Industry Partners",
    short: "Meet recruiters from top tech companies and discover internship offers.",
    description: "Representatives from software houses and telecom companies will present internship and job opportunities. Prepare your CV and get it reviewed by HR specialists on site.",
    agenda: ["Company booths", "CV review corner", "Panel: Starting your tech career", "Networking session"]
  },
  {
    id: 5, title: "UI/UX Design Bootcamp", category: "Workshop",
    date: "2027-02-05", time: "10:00 AM - 1:00 PM", location: "Lab 1, IT Building",
    icon: "fa-pen-ruler", cover: "cover-5", seats: 35, registered: 12,
    speaker: "Eng. Youssef Adel",
    short: "Design beautiful and usable interfaces using Figma from zero to prototype.",
    description: "A beginner-friendly bootcamp on user-centred design. You will learn wireframing, color theory, typography and how to create an interactive prototype in Figma.",
    agenda: ["Design thinking basics", "Wireframing", "Visual design in Figma", "Interactive prototyping"]
  },
  {
    id: 6, title: "Robotics Competition Finals", category: "Competition",
    date: "2027-02-18", time: "1:00 PM - 6:00 PM", location: "Sports Hall",
    icon: "fa-gears", cover: "cover-6", seats: 80, registered: 40,
    speaker: "Robotics Team",
    short: "Watch student-built robots compete in the annual line-follower challenge.",
    description: "The final round of our annual robotics competition. Teams compete with line-follower and obstacle-avoidance robots they built during the semester. Spectators are welcome!",
    agenda: ["Robot inspection", "Qualification rounds", "Final race", "Awards ceremony"]
  },
  {
    id: 7, title: "Git & GitHub Crash Course", category: "Workshop",
    date: "2026-11-05", time: "11:00 AM - 1:00 PM", location: "Lab 2, IT Building",
    icon: "fa-code-branch", cover: "cover-2", seats: 40, registered: 40,
    speaker: "Eng. Omar Khaled",
    short: "Version control essentials every developer must know.",
    description: "We covered repositories, commits, branches, pull requests and collaboration workflows on GitHub.",
    agenda: ["Git basics", "Branching", "Pull requests", "Team workflow"]
  },
  {
    id: 8, title: "Welcome Day 2026", category: "Networking",
    date: "2026-10-15", time: "10:00 AM - 3:00 PM", location: "Main Hall",
    icon: "fa-champagne-glasses", cover: "cover-3", seats: 250, registered: 250,
    speaker: "Club Board",
    short: "Our opening event for new members with games, food and club tours.",
    description: "We welcomed more than 250 new students, introduced club committees and celebrated the start of a new academic year.",
    agenda: ["Opening speech", "Committees fair", "Games & activities", "Group photo"]
  }
];

const MEMBERS = [
  { name: "Salsabil Al Qalshi", role: "President", group: "Board", dept: "Information Technology", year: "Level 2" },
  { name: "Ahmed Sultan", role: "Vice President", group: "Board", dept: "Information Technology", year: "Level 2" },
  { name: "Mariam Fathy", role: "General Secretary", group: "Board", dept: "Information Technology", year: "Level 2" },
  { name: "Omar Khaled", role: "Technical Lead", group: "Technical", dept: "Information Technology", year: "Level 3" },
  { name: "Nour El-Din Ali", role: "Web Developer", group: "Technical", dept: "Information Technology", year: "Level 2" },
  { name: "Yara Mostafa", role: "AI Researcher", group: "Technical", dept: "Information Technology", year: "Level 3" },
  { name: "Hana Ibrahim", role: "Graphic Designer", group: "Media", dept: "Industrial Technology", year: "Level 1" },
  { name: "Karim Samir", role: "Photographer", group: "Media", dept: "Energy Technology", year: "Level 2" },
  { name: "Farida Tarek", role: "Content Writer", group: "Media", dept: "Information Technology", year: "Level 1" },
  { name: "Mohamed Adel", role: "Events Coordinator", group: "Events", dept: "Mechatronics", year: "Level 2" },
  { name: "Rana Hossam", role: "PR Manager", group: "Events", dept: "Information Technology", year: "Level 2" },
  { name: "Youssef Nabil", role: "Logistics", group: "Events", dept: "Energy Technology", year: "Level 1" }
];

const NEWS = [
  {
    id: 1, title: "Our Team Won 1st Place at the Regional Hackathon", category: "Achievements",
    date: "2026-11-18", icon: "fa-trophy", cover: "cover-1",
    excerpt: "Four club members won first place among 30 teams at the Alexandria regional hackathon.",
    content: "The team built a smart attendance system using face recognition in just 24 hours. The judges praised the clean design and the real-world impact of the project. Congratulations to the team!"
  },
  {
    id: 2, title: "Registration Open for the Web Hackathon", category: "Announcements",
    date: "2026-11-12", icon: "fa-bullhorn", cover: "cover-2",
    excerpt: "Form your team and register now for the 12-hour Web Development Hackathon.",
    content: "Seats are limited to 60 participants. Teams can have up to 4 members. Registration closes on December 15, 2026. Visit the Events page to register."
  },
  {
    id: 3, title: "New Partnership with a Local Software Company", category: "Partnerships",
    date: "2026-11-02", icon: "fa-handshake", cover: "cover-4",
    excerpt: "The club signed a partnership that offers internships to active members.",
    content: "Thanks to this partnership, ten active members will get paid summer internships, plus monthly technical sessions delivered by senior engineers."
  },
  {
    id: 4, title: "Git & GitHub Session: Full House!", category: "Events",
    date: "2026-11-06", icon: "fa-code-branch", cover: "cover-3",
    excerpt: "40 students attended our crash course on version control.",
    content: "Attendees practiced branching and pull requests in real time. Slides and recordings are available for members in the club group."
  },
  {
    id: 5, title: "Robotics Team Starts Preparing for Finals", category: "Events",
    date: "2026-10-28", icon: "fa-gears", cover: "cover-6",
    excerpt: "Eight teams are now building robots for the February finals.",
    content: "Weekly mentoring sessions are held every Tuesday in the electronics lab. New members can still join as assistants."
  },
  {
    id: 6, title: "Welcome Day Brought 250+ New Members", category: "Achievements",
    date: "2026-10-16", icon: "fa-users", cover: "cover-5",
    excerpt: "Record attendance at the club's opening event for the new academic year.",
    content: "Students explored our committees, played tech quizzes and met the board. Thank you to all volunteers who made it possible."
  }
];

const GALLERY = [
  { title: "Welcome Day 2026", cat: "Events", icon: "fa-champagne-glasses", cover: "cover-3", tall: true },
  { title: "Hackathon Teams", cat: "Competitions", icon: "fa-laptop-code", cover: "cover-1" },
  { title: "AI Workshop", cat: "Workshops", icon: "fa-robot", cover: "cover-2" },
  { title: "Robotics Lab", cat: "Competitions", icon: "fa-gears", cover: "cover-6", tall: true },
  { title: "Git Session", cat: "Workshops", icon: "fa-code-branch", cover: "cover-4" },
  { title: "Award Ceremony", cat: "Events", icon: "fa-trophy", cover: "cover-5" },
  { title: "Design Bootcamp", cat: "Workshops", icon: "fa-pen-ruler", cover: "cover-3" },
  { title: "Career Day", cat: "Events", icon: "fa-briefcase", cover: "cover-1" },
  { title: "Cyber Seminar", cat: "Workshops", icon: "fa-shield-halved", cover: "cover-4" },
  { title: "Team Photo", cat: "Events", icon: "fa-camera", cover: "cover-2" }
];

const FAQS = [
  { q: "Who can join the TechMinds Club?", a: "Any student at Borg El Arab Technological University can join, from any department or level. No previous experience is required." },
  { q: "Is membership free?", a: "Yes! Membership is completely free. Some special workshops may have a small fee to cover materials, which is always announced in advance." },
  { q: "How do I register for an event?", a: "Go to the Events page, open the event you like and click 'Register Now', or use the Registration page directly. You will see a success message with your ticket number." },
  { q: "Can I cancel my registration?", a: "Yes. Open the 'My Registrations' page and click 'Cancel' next to the event you no longer want to attend." },
  { q: "Will I get a certificate?", a: "Attendees of workshops and bootcamps receive a certificate of attendance. Competition winners receive certificates and prizes." },
  { q: "How can I become a committee member?", a: "Committee recruitment opens at the start of each semester. Follow our News page and social media for announcements and application forms." }
];
