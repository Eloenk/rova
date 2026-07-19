import { Link } from 'react-router';
import { motion } from 'motion/react';
import { ArrowRight, Shield, Zap, Globe, Lock } from 'lucide-react';

export default function LandingPage() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #0d1520 0%, #1a3a42 50%, #0d1520 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated background orbs */}
      <div style={{ position: 'absolute', top: '10%', right: '5%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(191, 255, 0, 0.1) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '10%', left: '10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(180, 244, 215, 0.08) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none' }} />
      
      {/* Navigation */}
      <nav style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '24px 64px',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            borderRadius: '12px', 
            background: 'linear-gradient(135deg, var(--lime), var(--mint))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Zap size={24} color="#0d1520" strokeWidth={3} />
          </div>
          <span style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>
            ROVA
          </span>
        </div>
        
        <div style={{ display: 'flex', gap: '40px', alignItems: 'center' }}>
          <a href="#" style={{ color: 'var(--muted)', fontSize: '15px', fontWeight: 500, textDecoration: 'none' }}>Analytics</a>
          <a href="#" style={{ color: 'var(--muted)', fontSize: '15px', fontWeight: 500, textDecoration: 'none' }}>Docs</a>
          <a href="#" style={{ color: 'var(--muted)', fontSize: '15px', fontWeight: 500, textDecoration: 'none' }}>Governance</a>
          <a href="#" style={{ color: 'var(--muted)', fontSize: '15px', fontWeight: 500, textDecoration: 'none' }}>About</a>
          
          <Link 
            to="/dashboard" 
            className="cyber-button"
            style={{ 
              padding: '10px 24px', 
              borderRadius: '12px', 
              border: '1.5px solid rgba(180, 244, 215, 0.3)',
              background: 'rgba(180, 244, 215, 0.05)',
              color: 'var(--mint)',
              fontSize: '14px',
              fontWeight: 700,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            Explore Agent
            <ArrowRight size={16} />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '80px', 
        padding: '120px 64px',
        alignItems: 'center',
        maxWidth: '1400px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 1
      }}>
        
        {/* Left: Content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 style={{ 
            fontSize: '72px', 
            fontWeight: 800, 
            lineHeight: 1.1, 
            marginBottom: '24px',
            letterSpacing: '-0.03em',
            color: '#fff'
          }}>
            The Flow
            <br />
            Automation
            <br />
            <span className="text-gradient">Protocol</span>
          </h1>
          
          <p style={{ 
            fontSize: '20px', 
            lineHeight: 1.6, 
            color: 'var(--muted)', 
            marginBottom: '12px',
            maxWidth: '500px'
          }}>
            Capital flows <span style={{ color: '#fff', fontWeight: 600 }}>aren't easy to manage.</span>
          </p>
          <p style={{ 
            fontSize: '20px', 
            lineHeight: 1.6, 
            color: 'var(--muted)', 
            marginBottom: '48px',
            maxWidth: '500px'
          }}>
            But Rova makes you feel <span style={{ color: '#fff', fontWeight: 600 }}>like they are</span>.
          </p>
          
          <div style={{ display: 'flex', gap: '16px' }}>
            <Link 
              to="/builder"
              className="cyber-button"
              style={{ 
                padding: '16px 40px', 
                borderRadius: '16px', 
                background: 'var(--lime)',
                color: '#0d1520',
                fontSize: '16px',
                fontWeight: 800,
                textDecoration: 'none',
                border: 'none'
              }}
            >
              Sign In
            </Link>
            <button 
              className="cyber-button"
              style={{ 
                padding: '16px 32px', 
                borderRadius: '16px', 
                background: 'transparent',
                border: '1.5px solid rgba(180, 244, 215, 0.3)',
                color: '#fff',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Read The Documentation
            </button>
          </div>
          
          {/* Partner logos placeholder */}
          <div style={{ display: 'flex', gap: '32px', marginTop: '64px', opacity: 0.4 }}>
            <div style={{ fontSize: '14px', color: 'var(--subtle)', fontWeight: 600 }}>Arc Testnet</div>
            <div style={{ fontSize: '14px', color: 'var(--subtle)', fontWeight: 600 }}>StableFX</div>
            <div style={{ fontSize: '14px', color: 'var(--subtle)', fontWeight: 600 }}>CCTP</div>
          </div>
        </motion.div>

        {/* Right: 3D Visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          style={{ position: 'relative', height: '600px' }}
        >
          {/* Glass cards */}
          {[
            { top: '5%', left: '10%', value: '1.43%', amount: '+23742 DAI/day' },
            { top: '22%', left: '15%', value: '2.17%', amount: '+67738 USDT/day' },
            { top: '38%', left: '8%', value: '3.12%', amount: '+47238 DAI/day' },
            { top: '55%', left: '12%', value: '0.12%', amount: '+3241 USDT/day' },
            { top: '70%', left: '18%', value: '4.12%', amount: '+37.38 USDT/day' }
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 + i * 0.1 }}
              className="glass-card"
              style={{
                position: 'absolute',
                top: item.top,
                left: item.left,
                padding: '16px 24px',
                borderRadius: '16px',
                background: 'rgba(180, 244, 215, 0.12)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(180, 244, 215, 0.2)',
                minWidth: '200px',
                zIndex: 5 - i
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                <div style={{ 
                  width: '32px', 
                  height: '32px', 
                  borderRadius: '50%', 
                  background: 'rgba(191, 255, 0, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px'
                }}>
                  ₮
                </div>
                <span style={{ fontSize: '20px', fontWeight: 700, color: '#fff' }}>{item.value}</span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                {item.amount}
              </div>
            </motion.div>
          ))}

          {/* 3D Orb/Robot */}
          <motion.div
            animate={{ 
              y: [0, -15, 0],
              rotate: [0, 5, 0, -5, 0]
            }}
            transition={{ 
              duration: 6, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{ 
              position: 'absolute', 
              right: '10%', 
              top: '30%',
              width: '280px',
              height: '280px',
              zIndex: 10
            }}
          >
            <div style={{ 
              position: 'relative',
              width: '100%',
              height: '100%'
            }}>
              {/* Glowing sphere */}
              <div style={{
                position: 'absolute',
                width: '280px',
                height: '280px',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 30% 30%, rgba(191, 255, 0, 0.4), rgba(180, 244, 215, 0.2), transparent)',
                filter: 'blur(2px)',
                animation: 'glow 3s ease-in-out infinite'
              }} />
              
              {/* Robot/orb character */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '180px',
                height: '180px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #1a2838 0%, #0d1520 100%)',
                border: '3px solid var(--mint)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), inset 0 0 30px rgba(191, 255, 0, 0.1)'
              }}>
                {/* Eyes */}
                <div style={{ display: 'flex', gap: '40px' }}>
                  <div style={{ 
                    width: '20px', 
                    height: '20px', 
                    borderRadius: '50%', 
                    background: 'var(--lime)',
                    boxShadow: '0 0 20px var(--lime)',
                    animation: 'pulseGlow 2s ease-in-out infinite'
                  }} />
                  <div style={{ 
                    width: '20px', 
                    height: '20px', 
                    borderRadius: '50%', 
                    background: 'var(--lime)',
                    boxShadow: '0 0 20px var(--lime)',
                    animation: 'pulseGlow 2s ease-in-out infinite'
                  }} />
                </div>
              </div>
              
              {/* Orbit ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '240px',
                  height: '240px',
                  borderRadius: '50%',
                  border: '2px dashed rgba(180, 244, 215, 0.3)'
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: '-6px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: 'var(--mint)',
                  boxShadow: '0 0 15px var(--mint)'
                }} />
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Features Section */}
      <div style={{ 
        padding: '100px 64px', 
        maxWidth: '1400px', 
        margin: '0 auto',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{ textAlign: 'center', marginBottom: '80px' }}>
          <p style={{ color: 'var(--mint)', fontSize: '14px', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '16px', textTransform: 'uppercase' }}>
            Personalized based on your risk tolerance
          </p>
          <h2 style={{ fontSize: '48px', fontWeight: 800, marginBottom: '16px' }}>
            Automated and<br />Effortless <span className="text-gradient">Flows</span>
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px' }}>
          {[
            { icon: Shield, title: 'ERC-8004 Verified', desc: 'Onchain reputation and autonomous compliance.' },
            { icon: Zap, title: 'Sub-Second Finality', desc: 'Arc Native ensures lightning-fast settlements.' },
            { icon: Lock, title: 'Institutional Grade', desc: 'Built with StableFX and CCTP integration.' }
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
              className="glass-panel cyber-button"
              style={{
                padding: '40px',
                borderRadius: '24px',
                textAlign: 'center'
              }}
            >
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: 'rgba(191, 255, 0, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px'
              }}>
                <feature.icon size={32} color="var(--lime)" strokeWidth={2} />
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px', color: '#fff' }}>
                {feature.title}
              </h3>
              <p style={{ color: 'var(--muted)', fontSize: '15px', lineHeight: 1.6 }}>
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
