import { useState } from 'react'
import {
  ArrowLeft,
  Save,
  Sparkles,
  Building2,
  Users,
  MessageSquare,
  Languages,
  Hash,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react'
import './BrandProfile.css'

function BrandProfile({ onBack }) {
  const [saved, setSaved] = useState(false)

  const [form, setForm] = useState({
    brandName: 'AR Marketing Solutions',
    industry: 'Digital Marketing',
    audience:
      'Business owners, entrepreneurs, SMEs and individuals who want to grow their business online.',
    language: 'Bahasa Melayu',
    tone: 'Professional & Friendly',
    style: 'Educational, conversational, relatable and persuasive.',
    topics:
      'Digital marketing, social media marketing, business tips, entrepreneurship, branding, sales and content marketing.',
    avoid:
      'Politik, agama sensitif, isu perkauman, hate speech, misleading claims and offensive content.',
    hashtags:
      '#ARMarketingSolutions #DigitalMarketing #MarketingTips #BusinessTips',
    cta: 'Follow untuk lebih banyak tips marketing dan business.',
  })

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    })

    setSaved(false)
  }

  const handleSave = () => {
    localStorage.setItem('arContentPilotBrand', JSON.stringify(form))
    setSaved(true)

    setTimeout(() => {
      setSaved(false)
    }, 3000)
  }

  return (
    <div className="brand-page">
      {/* HEADER */}
      <div className="brand-header">
        <div className="brand-header-left">
          <button className="back-button" onClick={onBack}>
            <ArrowLeft size={18} />
          </button>

          <div>
            <div className="eyebrow">
              <Sparkles size={14} />
              AI PERSONALIZATION
            </div>

            <h1>Brand Profile</h1>

            <p>
              Teach AR ContentPilot how your brand should sound and what
              content it should create.
            </p>
          </div>
        </div>

        <button className="save-button" onClick={handleSave}>
          {saved ? (
            <>
              <CheckCircle2 size={18} />
              Saved
            </>
          ) : (
            <>
              <Save size={18} />
              Save Profile
            </>
          )}
        </button>
      </div>

      {/* MAIN GRID */}
      <div className="brand-layout">
        {/* LEFT */}
        <div className="brand-main">
          {/* BASIC INFORMATION */}
          <section className="brand-card">
            <div className="card-title">
              <div className="title-icon purple">
                <Building2 size={19} />
              </div>

              <div>
                <h2>Basic Information</h2>
                <p>Tell AI about your brand.</p>
              </div>
            </div>

            <div className="form-grid">
              <div className="field">
                <label>Brand Name</label>

                <input
                  name="brandName"
                  value={form.brandName}
                  onChange={handleChange}
                  placeholder="Your brand name"
                />
              </div>

              <div className="field">
                <label>Industry / Niche</label>

                <input
                  name="industry"
                  value={form.industry}
                  onChange={handleChange}
                  placeholder="Example: Digital Marketing"
                />
              </div>
            </div>

            <div className="field">
              <label>
                <Users size={14} />
                Target Audience
              </label>

              <textarea
                name="audience"
                value={form.audience}
                onChange={handleChange}
                rows="4"
                placeholder="Who are you creating content for?"
              />
            </div>
          </section>

          {/* VOICE */}
          <section className="brand-card">
            <div className="card-title">
              <div className="title-icon blue">
                <MessageSquare size={19} />
              </div>

              <div>
                <h2>Brand Voice</h2>
                <p>Define how your content should sound.</p>
              </div>
            </div>

            <div className="form-grid">
              <div className="field">
                <label>
                  <Languages size={14} />
                  Content Language
                </label>

                <select
                  name="language"
                  value={form.language}
                  onChange={handleChange}
                >
                  <option>Bahasa Melayu</option>
                  <option>English</option>
                  <option>Bahasa Melayu + English</option>
                </select>
              </div>

              <div className="field">
                <label>Tone of Voice</label>

                <select
                  name="tone"
                  value={form.tone}
                  onChange={handleChange}
                >
                  <option>Professional & Friendly</option>
                  <option>Professional</option>
                  <option>Casual & Friendly</option>
                  <option>Funny & Casual</option>
                  <option>Inspirational</option>
                  <option>Bold & Confident</option>
                  <option>Emotional & Relatable</option>
                </select>
              </div>
            </div>

            <div className="field">
              <label>Writing Style</label>

              <textarea
                name="style"
                value={form.style}
                onChange={handleChange}
                rows="4"
                placeholder="Describe how you want your content written."
              />
            </div>
          </section>

          {/* CONTENT STRATEGY */}
          <section className="brand-card">
            <div className="card-title">
              <div className="title-icon cyan">
                <Sparkles size={19} />
              </div>

              <div>
                <h2>Content Strategy</h2>
                <p>Control what the AI should talk about.</p>
              </div>
            </div>

            <div className="field">
              <label>Content Topics</label>

              <textarea
                name="topics"
                value={form.topics}
                onChange={handleChange}
                rows="5"
                placeholder="List topics that AI can create content about."
              />
            </div>

            <div className="field">
              <label>
                <ShieldAlert size={14} />
                Topics to Avoid
              </label>

              <textarea
                name="avoid"
                value={form.avoid}
                onChange={handleChange}
                rows="4"
                placeholder="Topics that AI should avoid."
              />
            </div>
          </section>

          {/* SOCIAL SETTINGS */}
          <section className="brand-card">
            <div className="card-title">
              <div className="title-icon orange">
                <Hash size={19} />
              </div>

              <div>
                <h2>Social Settings</h2>
                <p>Default settings for generated posts.</p>
              </div>
            </div>

            <div className="field">
              <label>Default Hashtags</label>

              <textarea
                name="hashtags"
                value={form.hashtags}
                onChange={handleChange}
                rows="3"
                placeholder="#marketing #business"
              />
            </div>

            <div className="field">
              <label>Default Call To Action</label>

              <input
                name="cta"
                value={form.cta}
                onChange={handleChange}
                placeholder="Example: Follow untuk lebih banyak tips."
              />
            </div>
          </section>
        </div>

        {/* RIGHT SIDEBAR */}
        <aside className="brand-sidebar">
          <div className="ai-preview-card">
            <div className="preview-glow"></div>

            <div className="preview-top">
              <div className="ai-icon">
                <Sparkles size={20} />
              </div>

              <div>
                <span>AI PERSONALITY</span>
                <h3>ContentPilot</h3>
              </div>
            </div>

            <p>
              Based on your profile, AI will create content that feels like
              your brand instead of generic AI content.
            </p>

            <div className="preview-tags">
              <span>{form.language}</span>
              <span>{form.tone}</span>
              <span>Business</span>
            </div>
          </div>

          <div className="profile-status">
            <div className="status-header">
              <span>PROFILE COMPLETION</span>
              <strong>100%</strong>
            </div>

            <div className="progress">
              <div></div>
            </div>

            <div className="status-item">
              <CheckCircle2 size={16} />
              Brand information
            </div>

            <div className="status-item">
              <CheckCircle2 size={16} />
              Target audience
            </div>

            <div className="status-item">
              <CheckCircle2 size={16} />
              Brand voice
            </div>

            <div className="status-item">
              <CheckCircle2 size={16} />
              Content strategy
            </div>
          </div>

          <div className="tip-card">
            <Sparkles size={18} />

            <div>
              <strong>Pro Tip</strong>

              <p>
                The more specific your brand profile is, the more natural and
                relevant your AI-generated content will become.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default BrandProfile