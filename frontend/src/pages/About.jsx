import React from 'react';
import { Target, Compass, Heart, Smile, Users, School } from 'lucide-react';

export default function About() {
  const staff = [
    { name: 'Dr. Shruti Sen', role: 'School Principal', qualifications: 'Ph.D. in Child Psychology', img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300' },
    { name: 'Miss Emily Stone', role: 'Nursery Lead Teacher', qualifications: 'M.Ed. in Child Development', img: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300' },
    { name: 'Mr. David Vance', role: 'Play Activities Coordinator', qualifications: 'B.A. in Early Education & Music', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300' },
    { name: 'Mrs. Linda Parker', role: 'KG Instructor', qualifications: 'Advanced Montessori Certification', img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300' }
  ];

  const coreValues = [
    { title: 'Creativity', text: 'Encouraging children to express their thoughts through paint, building, and storytelling.', icon: Smile, color: 'bg-brandYellow/10 text-brandYellow-dark' },
    { title: 'Safety First', text: 'Fully protected campus with 24/7 security cameras, padded playgrounds, and clean water.', icon: Heart, color: 'bg-brandCoral/10 text-brandCoral-dark' },
    { title: 'Inclusivity', text: 'A friendly community welcoming children from all walks of life and supporting learning speeds.', icon: Users, color: 'bg-brandSky/10 text-brandSky-dark' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 space-y-16">
      
      {/* Introduction Hero */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7 space-y-6">
          <span className="text-brandCoral font-bold text-xs uppercase tracking-widest bg-brandCoral/10 px-3 py-1 rounded-full border border-brandCoral/20">WHO WE ARE</span>
          <h1 className="text-4xl md:text-5xl text-slate-800 font-extrabold leading-tight">
            Nurturing Young Minds & Inspiring Creative Learners
          </h1>
          <p className="text-sm md:text-base text-slate-600 leading-relaxed font-medium">
            Apna School is a premier early childhood learning academy. Founded with a vision to revolutionize primary education, we combine standard Montessori methodologies with play-based developmental goals to prepare toddlers for primary school and beyond.
          </p>
          <p className="text-sm text-slate-500 leading-relaxed">
            Our campus features bright activity centers, sensory sandboxes, smart visual boards, and an organic vegetable patch where kids connect directly with nature. We maintain a strict student-to-teacher ratio of 8:1 to ensure that every single child gets the attention and warmth they need to flourish.
          </p>
        </div>
        
        <div className="lg:col-span-5 relative">
          <div className="overflow-hidden rounded-3xl border-8 border-white shadow-xl bg-white rotate-[2deg] hover:rotate-0 transition-transform duration-300">
            <img
              src="https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=800"
              alt="Toddler painting with teacher"
              className="w-full h-[320px] object-cover"
            />
          </div>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="bg-white border border-orange-50 p-8 md:p-12 rounded-3xl shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 relative overflow-hidden">
        {/* Decorative element */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-brandYellow/10 rounded-bl-full pointer-events-none" />
        
        <div className="space-y-4">
          <div className="w-12 h-12 rounded-xl bg-brandCoral/10 flex items-center justify-center text-brandCoral">
            <Target className="w-6 h-6" />
          </div>
          <h3 className="font-quicksand font-bold text-2xl text-slate-800">Our Vision</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            To create a joyful, secure, and nurturing world where early learners can confidently explore their potentials, develop critical thinking, collaborate selflessly with their peers, and build a foundations to be global citizens.
          </p>
        </div>

        <div className="space-y-4">
          <div className="w-12 h-12 rounded-xl bg-brandSky/10 flex items-center justify-center text-brandSky">
            <Compass className="w-6 h-6" />
          </div>
          <h3 className="font-quicksand font-bold text-2xl text-slate-800">Our Mission</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            To deliver top-tier holistic education using modern child-centric toolsets, maintaining standard hygiene practices, fostering creative experimentation, and keeping parents actively aligned with their children’s development logs.
          </p>
        </div>
      </section>

      {/* Principal Message */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center bg-[#FAF8F5] border border-orange-50 rounded-3xl p-8 md:p-12">
        <div className="lg:col-span-4 flex justify-center">
          <img
            src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400"
            alt="Dr. Shruti Sen Principal"
            className="w-48 h-48 md:w-56 md:h-56 rounded-2xl object-cover shadow-md border-4 border-white"
          />
        </div>
        
        <div className="lg:col-span-8 space-y-4 text-left">
          <span className="text-brandSky font-bold text-xs uppercase tracking-widest">MESSAGE FROM THE PRINCIPAL</span>
          <h3 className="font-quicksand font-bold text-2xl text-slate-800">Welcome to Our Learning Family!</h3>
          <p className="text-sm text-slate-600 leading-relaxed italic">
            "Every child is a distinct flower, and together, they make this world a beautiful garden. At Apna School, our duty is to cultivate this garden with care, affection, and patience. We don't just teach children lessons; we help them build experiences, navigate their feelings, and celebrate small achievements every single day. I invite you to join our family and witness your child bloom."
          </p>
          <div>
            <h4 className="font-quicksand font-bold text-slate-800 text-sm">Dr. Shruti Sen</h4>
            <p className="text-[10px] text-slate-500 font-semibold uppercase">Principal, Apna School</p>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="text-center space-y-4">
        <h2 className="text-3xl font-quicksand font-bold text-slate-800">Our Core Values</h2>
        <p className="text-sm text-slate-500 max-w-lg mx-auto">
          These principles guide every class, play session, and curriculum planning at our school.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 text-left">
          {coreValues.map((val, idx) => (
            <div key={idx} className="bg-white border border-orange-50 rounded-2xl p-6 shadow-sm space-y-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${val.color}`}>
                <val.icon className="w-5 h-5" />
              </div>
              <h3 className="font-quicksand font-bold text-lg text-slate-800">{val.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{val.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Faculty Information */}
      <section className="text-center space-y-4">
        <h2 className="text-3xl font-quicksand font-bold text-slate-800">Meet Our Educators</h2>
        <p className="text-sm text-slate-500 max-w-lg mx-auto">
          Our team comprises highly qualified, warm, and safety-trained teachers specializing in early years development.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-8">
          {staff.map((member, idx) => (
            <div key={idx} className="bg-white border border-orange-50 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <img
                src={member.img}
                alt={member.name}
                className="w-full h-48 object-cover"
              />
              <div className="p-4 space-y-1 text-center">
                <h4 className="font-quicksand font-bold text-slate-800 text-sm">{member.name}</h4>
                <p className="text-[10px] text-brandCoral font-bold uppercase">{member.role}</p>
                <p className="text-xs text-slate-500">{member.qualifications}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
