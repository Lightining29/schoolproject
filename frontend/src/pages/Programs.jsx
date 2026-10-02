import React, { useState } from 'react';
import { BookOpen, Smile, Award, CheckCircle, Clock } from 'lucide-react';

export default function Programs() {
  const [activeTab, setActiveTab] = useState(0);

  const programsData = [
    {
      name: 'Pre-Nursery (Infants)',
      age: '6 Weeks - 18 Months',
      description: 'Our infant program focusing on sensory discovery, emotional safety, and primary motor skills in a soothing, highly clean nursery chamber.',
      milestones: [
        'Sensory exploration (textures, soft sounds)',
        'Grip control and rolling development',
        'Primary vocabulary and sound mimicry',
        'Emotional bonding and safety recognition'
      ],
      schedule: [
        { time: '08:30 AM', activity: 'Warm Welcome & Sensory Toys play' },
        { time: '10:00 AM', activity: 'Healthy Milk/Puree feeding' },
        { time: '11:00 AM', activity: 'Quiet Nap Time' },
        { time: '12:30 PM', activity: 'Tummy Time & Motor play' },
        { time: '02:00 PM', activity: 'Storytelling & Music listening' }
      ],
      color: 'border-brandMint text-brandMint-dark bg-brandMint/5',
      badgeColor: 'bg-brandMint text-white'
    },
    {
      name: 'Nursery (Toddlers)',
      age: '18 Months - 3 Years',
      description: 'A play-based syllabus designed to trigger imagination, vocabulary development, motor coordination, and initial social group boundaries.',
      milestones: [
        'Sharing toys and group social play',
        'Sentence building and active conversation',
        'Color, shape, and pattern matching',
        'Basic toilet training assistance'
      ],
      schedule: [
        { time: '08:30 AM', activity: 'Morning Circle: greetings & songs' },
        { time: '09:30 AM', activity: 'Guided Art: painting & clay shaping' },
        { time: '10:30 AM', activity: 'Outdoor play: sandbox & slides' },
        { time: '11:30 AM', activity: 'Nutritious Hot Lunch' },
        { time: '01:00 PM', activity: 'Nap / Storytelling time' }
      ],
      color: 'border-brandYellow text-brandYellow-dark bg-brandYellow/5',
      badgeColor: 'bg-brandYellow-dark text-slate-800'
    },
    {
      name: 'Junior KG (Preschool)',
      age: '3 - 5 Years',
      description: 'Introductory academics mixed with creative projects. Children learn letter sounds, simple counting, and structured social cooperation.',
      milestones: [
        'Phonics awareness and letter writing',
        'Numbers 1 to 50 and basic additions',
        'Drawing landscapes and complex shapes',
        'Tying shoe laces and self-cleaning'
      ],
      schedule: [
        { time: '08:30 AM', activity: 'Attendance & Alphabet phonics' },
        { time: '09:30 AM', activity: 'Interactive Math (counting items)' },
        { time: '10:30 AM', activity: 'Snack break & Social discussions' },
        { time: '11:15 AM', activity: 'Computer lab: interactive puzzles' },
        { time: '12:30 PM', activity: 'Dramatic roleplay & Science experiments' }
      ],
      color: 'border-brandSky text-brandSky-dark bg-brandSky/5',
      badgeColor: 'bg-brandSky text-white'
    },
    {
      name: 'Senior KG (Pre-Kindergarten)',
      age: '4 - 6 Years',
      description: 'Advanced curriculum structured to transition young learners smoothly into elementary school. Focuses on writing, reading, and basic logic reasoning.',
      milestones: [
        'Short stories reading and writing sentences',
        'Single digit addition and subtraction',
        'Basic science concepts (water cycle, plant growth)',
        'Public speaking and show-and-tell tasks'
      ],
      schedule: [
        { time: '08:30 AM', activity: 'Vocabulary and spelling building' },
        { time: '09:30 AM', activity: 'Logical math & problem solving' },
        { time: '10:30 AM', activity: 'P.E. Playground sports / Dance class' },
        { time: '11:30 AM', activity: 'Science Lab: nature study and seeds planting' },
        { time: '01:00 PM', activity: 'Quiet reading & homework guidance' }
      ],
      color: 'border-brandCoral text-brandCoral-dark bg-brandCoral/5',
      badgeColor: 'bg-brandCoral text-white'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 space-y-12">
      
      {/* Title */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <span className="text-brandCoral font-bold text-xs uppercase tracking-widest bg-brandCoral/10 px-3 py-1 rounded-full">EDUCATION PATHWAYS</span>
        <h1 className="text-4xl font-quicksand font-bold text-slate-800">Syllabus & Curriculum Details</h1>
        <p className="text-sm text-slate-500">
          Our specialized learning blocks are custom-tailored to cater to early developmental phases, blending cognitive studies with rich physical play.
        </p>
      </div>

      {/* Tabs list */}
      <div className="flex flex-wrap justify-center gap-3">
        {programsData.map((prog, idx) => (
          <button
            key={idx}
            onClick={() => setActiveTab(idx)}
            className={`px-6 py-3 rounded-full font-quicksand font-bold text-sm shadow-sm transition-all border ${
              activeTab === idx
                ? 'bg-brandYellow text-slate-800 border-brandYellow shadow-md transform -translate-y-0.5'
                : 'bg-white text-slate-600 border-orange-50 hover:bg-orange-50/20'
            }`}
          >
            {prog.name.split(' ')[0]} {/* Category short name */}
          </button>
        ))}
      </div>

      {/* Active Program Card */}
      <div className="bg-white border border-orange-50 rounded-3xl p-6 md:p-10 shadow-md grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Summary */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-2">
            <span className={`px-4 py-1.5 rounded-full font-bold text-xs uppercase ${programsData[activeTab].badgeColor}`}>
              {programsData[activeTab].name}
            </span>
            <h2 className="text-3xl font-quicksand font-bold text-slate-800 mt-2">
              Age bracket: {programsData[activeTab].age}
            </h2>
            <p className="text-sm md:text-base text-slate-600 leading-relaxed font-medium pt-2">
              {programsData[activeTab].description}
            </p>
          </div>

          {/* Milestones list */}
          <div className="space-y-3 pt-2">
            <h3 className="font-quicksand font-bold text-lg text-slate-800 flex items-center space-x-2">
              <Award className="w-5 h-5 text-brandCoral" />
              <span>Key Developmental Milestones</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {programsData[activeTab].milestones.map((ms, idx) => (
                <div key={idx} className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-brandMint shrink-0 mt-0.5" />
                  <span className="text-xs text-slate-600">{ms}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Routine Schedule */}
        <div className="lg:col-span-5 bg-brandCream rounded-2xl p-6 border border-orange-100/50 space-y-4">
          <h3 className="font-quicksand font-bold text-lg text-slate-800 flex items-center space-x-2 border-b border-orange-100 pb-2">
            <Clock className="w-5 h-5 text-brandSky" />
            <span>Typical Daily Schedule</span>
          </h3>
          <div className="space-y-4">
            {programsData[activeTab].schedule.map((item, idx) => (
              <div key={idx} className="flex space-x-4 items-start">
                <span className="text-xs font-bold text-brandCoral bg-white px-2.5 py-1 rounded-md border border-orange-100 whitespace-nowrap shadow-sm">
                  {item.time}
                </span>
                <div className="text-xs text-slate-600 font-medium pt-0.5">
                  {item.activity}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Curriculum Details Philosophy */}
      <section className="bg-brandCream-dark/30 border border-orange-50/50 p-8 rounded-3xl grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
        <div className="space-y-2">
          <h4 className="font-quicksand font-bold text-slate-800">Interactive Visuals</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            All rooms are equipped with kids touch-tables and projection maps for physical-digital learning exploration.
          </p>
        </div>
        <div className="space-y-2">
          <h4 className="font-quicksand font-bold text-slate-800">Monthly PTM Updates</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Detailed learning logs mapping vocabulary gains and social cooperation indices shared transparently each month.
          </p>
        </div>
        <div className="space-y-2">
          <h4 className="font-quicksand font-bold text-slate-800">Physical Fitness Blocks</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Dancing, playground obstacle courses, and basic gymnastics classes built directly into the weekly roster.
          </p>
        </div>
      </section>

    </div>
  );
}
