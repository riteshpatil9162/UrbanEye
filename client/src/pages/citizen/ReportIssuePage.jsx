import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, MapPin, X, CheckCircle, Loader,
  Camera, RefreshCw, AlertTriangle, ShieldCheck, ShieldX,
  ScanSearch, ArrowRight, RotateCcw,
} from 'lucide-react';
import { reportIssue, validateIssueImage } from '../../services/issueService';
import { ISSUE_TYPES, AREAS } from '../../utils/helpers';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────────────────────
// Watermark overlay
// ─────────────────────────────────────────────────────────────────────────────
const addWatermarkToFile = (file, lat, lng) =>
  new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      const fontSize = Math.max(16, Math.round(img.width * 0.025));
      ctx.font = `bold ${fontSize}px monospace`;
      ctx.textBaseline = 'bottom';

      const now = new Date();
      const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
      const coordStr = lat && lng ? `${parseFloat(lat).toFixed(5)}, ${parseFloat(lng).toFixed(5)}` : 'Location unavailable';

      const lines = [`📅 ${dateStr}  🕐 ${timeStr}`, `📍 ${coordStr}`];
      const padding = Math.round(fontSize * 0.6);
      const lineH = fontSize * 1.5;
      const boxH = lines.length * lineH + padding * 1.5;
      const maxTextW = Math.max(...lines.map((l) => ctx.measureText(l).width));
      const boxW = maxTextW + padding * 2;
      const boxX = img.width - boxW - padding;
      const boxY = img.height - boxH - padding;

      ctx.fillStyle = 'rgba(0,0,0,0.60)';
      ctx.beginPath();
      ctx.roundRect
        ? ctx.roundRect(boxX, boxY, boxW, boxH, 6)
        : ctx.rect(boxX, boxY, boxW, boxH);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      lines.forEach((line, i) => {
        ctx.fillText(line, boxX + padding, boxY + (i + 1) * lineH + padding * 0.4);
      });

      canvas.toBlob(
        (blob) => {
          const watermarked = new File([blob], file.name, { type: 'image/jpeg' });
          resolve({ file: watermarked, preview: URL.createObjectURL(blob) });
        },
        'image/jpeg',
        0.92
      );
    };
    img.src = url;
  });

// ─────────────────────────────────────────────────────────────────────────────
// Camera modal
// ─────────────────────────────────────────────────────────────────────────────
function CameraModal({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [facingMode, setFacingMode] = useState('environment');

  const startCamera = useCallback(async (facing) => {
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); setReady(true); }
    } catch {
      toast.error('Camera access denied or not available.');
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    startCamera(facingMode);
    return () => { streamRef.current?.getTracks().forEach((t) => t.stop()); };
  }, [facingMode]);

  const capture = () => {
    const video = videoRef.current; const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
      streamRef.current?.getTracks().forEach((t) => t.stop());
      onCapture(file);
    }, 'image/jpeg', 0.92);
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center">
      <div className="relative w-full max-w-lg">
        <video ref={videoRef} className="w-full rounded-none" playsInline muted />
        <canvas ref={canvasRef} className="hidden" />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-48 h-48 border-2 border-white/50 rounded-lg" />
        </div>
      </div>
      <div className="flex items-center gap-6 mt-6">
        <button onClick={onClose} className="w-12 h-12 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30">
          <X className="w-5 h-5" />
        </button>
        <button onClick={capture} disabled={!ready} className="w-16 h-16 rounded-full bg-white text-gray-900 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 shadow-lg">
          <Camera className="w-7 h-7" />
        </button>
        <button onClick={() => setFacingMode((f) => (f === 'environment' ? 'user' : 'environment'))} className="w-12 h-12 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>
      <p className="text-white/60 text-xs mt-3">Tap the white button to capture</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// IMAGE REJECTED POPUP  (red — mismatch detected)
// ─────────────────────────────────────────────────────────────────────────────
function ImageRejectedPopup({ validation, issueType, onChangeImage }) {
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.90, y: 16 }}
        transition={{ type: 'spring', stiffness: 340, damping: 28 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        {/* Red top band */}
        <div className="bg-gradient-to-br from-red-500 to-rose-600 px-6 pt-8 pb-6 flex flex-col items-center text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 400, damping: 20 }}
            className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-4 ring-4 ring-white/30"
          >
            <ShieldX className="w-10 h-10 text-white" />
          </motion.div>
          <h3 className="text-xl font-extrabold text-white tracking-tight">Image Rejected</h3>
          <p className="text-red-100 text-sm mt-1.5 leading-snug">
            Your image does not match the selected issue type
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-3">
          {/* Selected type chip */}
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
            <span className="text-xs font-bold text-red-500 uppercase tracking-widest">Issue Type</span>
            <span className="ml-auto text-sm font-bold text-red-700">{issueType}</span>
          </div>

          {/* What AI detected */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">What AI Detected</p>
            <p className="text-sm text-slate-700 leading-snug">{validation.detectedContent}</p>
          </div>

          {/* Mismatch reason */}
          {validation.mismatchReason && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-amber-500 uppercase tracking-wide mb-1">Why Rejected</p>
              <p className="text-sm text-amber-800 leading-snug">{validation.mismatchReason}</p>
            </div>
          )}

          {/* What to fix */}
          {validation.whatToFix && (
            <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
              <ArrowRight className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
              <p className="text-sm text-blue-800 leading-snug">{validation.whatToFix}</p>
            </div>
          )}

          {/* Confidence bar */}
          <div className="flex items-center gap-3 pt-1">
            <span className="text-xs text-slate-400 whitespace-nowrap">AI Confidence</span>
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${validation.confidence}%` }}
                transition={{ duration: 0.7, delay: 0.3 }}
                className="h-full bg-red-400 rounded-full"
              />
            </div>
            <span className="text-xs font-semibold text-slate-600">{validation.confidence}%</span>
          </div>
        </div>

        {/* CTA */}
        <div className="px-6 pb-6">
          <button
            onClick={onChangeImage}
            className="w-full py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-2xl font-bold text-sm hover:from-red-600 hover:to-rose-700 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-200"
          >
            <RotateCcw className="w-4 h-4" />
            Upload the Correct Image
          </button>
          <p className="text-center text-xs text-slate-400 mt-3">
            Only genuine images matching the issue type are accepted by UrbanEye AI.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// IMAGE APPROVED POPUP  (green — match confirmed)
// ─────────────────────────────────────────────────────────────────────────────
function ImageApprovedPopup({ validation, issueType, onProceed }) {
  // Auto-dismiss after 3 s so the user doesn't have to click
  useEffect(() => {
    const t = setTimeout(onProceed, 3000);
    return () => clearTimeout(t);
  }, [onProceed]);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.90, y: 16 }}
        transition={{ type: 'spring', stiffness: 340, damping: 28 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        {/* Green top band */}
        <div className="bg-gradient-to-br from-emerald-500 to-green-600 px-6 pt-8 pb-6 flex flex-col items-center text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1] }}
            transition={{ delay: 0.08, duration: 0.5 }}
            className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-4 ring-4 ring-white/30"
          >
            <ShieldCheck className="w-10 h-10 text-white" />
          </motion.div>
          <h3 className="text-xl font-extrabold text-white tracking-tight">Image Approved!</h3>
          <p className="text-green-100 text-sm mt-1.5 leading-snug">
            AI confirmed your image matches the issue type
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-3">
          {/* Issue chip */}
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
            <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Issue Type</span>
            <span className="ml-auto text-sm font-bold text-emerald-700">{issueType}</span>
          </div>

          {/* What AI saw */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">AI Observation</p>
            <p className="text-sm text-slate-700 leading-snug">{validation.detectedContent}</p>
          </div>

          {/* Approval message */}
          {validation.approvalMessage && (
            <div className="flex items-start gap-2.5 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
              <p className="text-sm text-green-800 leading-snug font-medium">{validation.approvalMessage}</p>
            </div>
          )}

          {/* Confidence bar */}
          <div className="flex items-center gap-3 pt-1">
            <span className="text-xs text-slate-400 whitespace-nowrap">AI Confidence</span>
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${validation.confidence}%` }}
                transition={{ duration: 0.7, delay: 0.3 }}
                className="h-full bg-emerald-400 rounded-full"
              />
            </div>
            <span className="text-xs font-semibold text-slate-600">{validation.confidence}%</span>
          </div>
        </div>

        {/* CTA */}
        <div className="px-6 pb-6">
          <button
            onClick={onProceed}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-2xl font-bold text-sm hover:from-emerald-600 hover:to-green-700 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-200"
          >
            <ArrowRight className="w-4 h-4" />
            Continue &amp; Submit Report
          </button>
          <p className="text-center text-xs text-slate-400 mt-3">
            Auto-submitting in a moment…
          </p>
        </div>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATING OVERLAY — shown while Gemini inspects the image
// ─────────────────────────────────────────────────────────────────────────────
function ValidatingOverlay({ issueType }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-sm px-8 py-10 flex flex-col items-center text-center"
      >
        <div className="relative w-20 h-20 mb-5">
          {/* Spinning ring */}
          <svg className="absolute inset-0 w-full h-full animate-spin" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="34" fill="none" stroke="#e2e8f0" strokeWidth="6" />
            <circle cx="40" cy="40" r="34" fill="none" stroke="#6366f1" strokeWidth="6"
              strokeDasharray="80 134" strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <ScanSearch className="w-8 h-8 text-primary-600" />
          </div>
        </div>
        <h3 className="text-base font-bold text-slate-800 mb-1">Analyzing Your Image</h3>
        <p className="text-sm text-slate-500 leading-snug">
          AI is verifying your photo matches
          {issueType ? <><br /><span className="font-semibold text-slate-700"> "{issueType}"</span></> : ' the selected issue type'}
        </p>
        <div className="flex gap-1 mt-5">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-2 h-2 rounded-full bg-primary-400"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
const ReportIssuePage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({ title: '', description: '', issueType: '', area: '', lat: '', lng: '' });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  // ── Validation state machine ──
  // null | 'validating' | 'approved' | 'rejected'
  const [validationState, setValidationState] = useState(null);
  const [validationData, setValidationData] = useState(null); // raw AI result

  useEffect(() => { detectLocation(); }, []);

  const detectLocation = () => {
    if (!navigator.geolocation) return;
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({ ...f, lat: pos.coords.latitude.toFixed(6), lng: pos.coords.longitude.toFixed(6) }));
        setLocationLoading(false);
      },
      () => { setLocationLoading(false); toast.error('Unable to auto-detect location. Enter manually.'); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // ── Run Cloud Vision image validation (via backend proxy) ───────────────
  const runImageValidation = async (file, issueType) => {
    if (!issueType || !file) return;
    setValidationState('validating');
    setValidationData(null);
    try {
      const fd = new FormData();
      fd.append('image', file);
      fd.append('issueType', issueType);
      fd.append('description', form.description || '');
      const res = await validateIssueImage(fd);
      const v = res.data.validation;
      setValidationData(v);
      setValidationState(v.imageMatchesIssue ? 'approved' : 'rejected');
    } catch {
      // If the backend is unreachable, fail open (non-blocking)
      setValidationState(null);
    }
  };

  // ── Process uploaded/captured image ──────────────────────────────────────
  const processImage = async (file, lat, lng, issueType) => {
    const { file: watermarked, preview } = await addWatermarkToFile(file, lat, lng);
    setImage(watermarked);
    setImagePreview(preview);
    setValidationState(null);
    setValidationData(null);
    if (issueType) runImageValidation(watermarked, issueType);
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error('Image must be less than 10MB.'); return; }
    await processImage(file, form.lat, form.lng, form.issueType);
    // reset input so same file can be re-selected after rejection
    e.target.value = '';
  };

  const handleCameraCapture = async (file) => {
    setShowCamera(false);
    await processImage(file, form.lat, form.lng, form.issueType);
  };

  const handleIssueTypeChange = async (e) => {
    const val = e.target.value;
    setForm((f) => ({ ...f, issueType: val }));
    setValidationState(null);
    setValidationData(null);
    if (image && val) runImageValidation(image, val);
  };

  // ── Actual form submission ────────────────────────────────────────────────
  const doSubmit = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      formData.append('image', image);
      await reportIssue(formData);
      toast.success('Issue reported successfully!');
      setTimeout(() => navigate('/citizen/my-issues'), 1800);
    } catch (err) {
      // Backend double-check caught a mismatch (edge case)
      if (err?.response?.status === 422 && err.response?.data?.validation) {
        const v = err.response.data.validation;
        setValidationData(v);
        setValidationState('rejected');
      } else {
        toast.error(err?.response?.data?.message || 'Failed to report issue.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) return toast.error('Please upload an issue image.');
    if (!form.lat || !form.lng) return toast.error('Please provide a location.');
    if (validationState === 'rejected') return toast.error('Please upload a correct image first.');
    if (validationState === 'validating') return; // already showing overlay
    doSubmit();
  };

  // When approval popup "Continue" is pressed (or auto-fires)
  const handleApprovalProceed = () => {
    setValidationState(null); // close popup
    doSubmit();
  };

  // When rejection popup asks user to change image
  const handleChangeImage = () => {
    setValidationState(null);
    setValidationData(null);
    setImage(null);
    setImagePreview(null);
    fileInputRef.current?.click();
  };

  // ── Derived submit-button state ──────────────────────────────────────────
  const isSubmitDisabled = loading || validationState === 'validating' || validationState === 'rejected';
  const submitLabel = loading
    ? <span className="flex items-center gap-2"><Loader className="w-4 h-4 animate-spin" /> Submitting...</span>
    : validationState === 'validating'
    ? <span className="flex items-center gap-2"><Loader className="w-4 h-4 animate-spin" /> Validating Image...</span>
    : validationState === 'rejected'
    ? <span className="flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Fix Image First</span>
    : 'Submit Issue Report';

  return (
    <div>
      {/* ── Camera ── */}
      {showCamera && <CameraModal onCapture={handleCameraCapture} onClose={() => setShowCamera(false)} />}

      {/* ── Validating overlay ── */}
      <AnimatePresence>
        {validationState === 'validating' && <ValidatingOverlay issueType={form.issueType} />}
      </AnimatePresence>

      {/* ── Rejected popup ── */}
      <AnimatePresence>
        {validationState === 'rejected' && validationData && (
          <ImageRejectedPopup
            validation={validationData}
            issueType={form.issueType}
            onChangeImage={handleChangeImage}
          />
        )}
      </AnimatePresence>

      {/* ── Approved popup ── */}
      <AnimatePresence>
        {validationState === 'approved' && validationData && (
          <ImageApprovedPopup
            validation={validationData}
            issueType={form.issueType}
            onProceed={handleApprovalProceed}
          />
        )}
      </AnimatePresence>

      {/* ── Page header ── */}
      <div className="mb-6">
        <h1 className="page-title">Report a Municipal Issue</h1>
        <p className="page-subtitle">Submit your issue with evidence. AI verifies every image automatically.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Form ── */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="card p-5 sm:p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="label">Issue Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="E.g., Deep pothole near bus stop"
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="label">Issue Type *</label>
                <select value={form.issueType} onChange={handleIssueTypeChange} className="input-field" required>
                  <option value="">Select type</option>
                  {ISSUE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label className="label">Area *</label>
                <select value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} className="input-field" required>
                  <option value="">Select area</option>
                  {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="label">Description *</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe the issue in detail — severity, exact location, context."
                  className="input-field h-24 resize-none"
                  required
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="label flex items-center gap-2">
                Location Coordinates *
                {locationLoading && <Loader className="w-3.5 h-3.5 animate-spin text-primary-500" />}
                {form.lat && form.lng && !locationLoading && (
                  <span className="text-xs text-green-600 font-normal flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Location detected
                  </span>
                )}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} placeholder="Latitude" className="input-field" step="any" required />
                <input type="number" value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} placeholder="Longitude" className="input-field" step="any" required />
              </div>
              <button type="button" onClick={detectLocation} disabled={locationLoading} className="mt-2 flex items-center gap-1.5 text-xs text-primary-600 hover:underline font-medium disabled:opacity-60">
                <MapPin className="w-3.5 h-3.5" />
                {locationLoading ? 'Detecting...' : 'Re-detect my location'}
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitDisabled}
              className="btn-primary w-full justify-center py-2.5 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitLabel}
            </button>
          </form>
        </div>

        {/* ── Image upload panel ── */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="section-heading">Issue Image *</h3>
            <p className="text-xs text-gray-400 mb-3">Date, time & location will be stamped automatically.</p>

            {/* Validation status badge */}
            {validationState === 'approved' && (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 mb-3">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="text-xs font-semibold text-emerald-700">AI Approved — Image Matches Issue</span>
              </div>
            )}
            {validationState === 'rejected' && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">
                <ShieldX className="w-4 h-4 text-red-500 shrink-0" />
                <span className="text-xs font-semibold text-red-700">AI Rejected — Image Doesn't Match</span>
              </div>
            )}

            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className={`w-full h-52 object-cover rounded-xl transition-all ${
                    validationState === 'rejected' ? 'ring-2 ring-red-400 opacity-70' :
                    validationState === 'approved' ? 'ring-2 ring-emerald-400' : ''
                  }`}
                />
                <button
                  type="button"
                  onClick={() => { setImage(null); setImagePreview(null); setValidationState(null); setValidationData(null); }}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full shadow"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                {validationState === 'validating' && (
                  <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <Loader className="w-3 h-3 animate-spin" /> Validating...
                  </div>
                )}
                {validationState === 'approved' && (
                  <div className="absolute bottom-2 left-2 bg-emerald-500/90 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Approved
                  </div>
                )}
                {validationState === 'rejected' && (
                  <div className="absolute bottom-2 left-2 bg-red-500/90 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <ShieldX className="w-3 h-3" /> Rejected
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-200 hover:border-primary-300 rounded-xl p-6 text-center transition-colors"
                >
                  <Upload className="w-7 h-7 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 font-medium">Upload from Gallery</p>
                  <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP · Max 10MB</p>
                </button>
                <button
                  type="button"
                  onClick={() => setShowCamera(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 border border-primary-200 bg-primary-50 text-primary-700 rounded-xl text-sm font-medium hover:bg-primary-100 transition-colors"
                >
                  <Camera className="w-4 h-4" /> Capture with Camera
                </button>
              </div>
            )}

            <input ref={fileInputRef} id="image-upload" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />

            {imagePreview && (
              <div className="flex gap-2 mt-3">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">
                  <Upload className="w-3.5 h-3.5" /> Upload
                </button>
                <button type="button" onClick={() => setShowCamera(true)} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs border border-primary-200 rounded-lg hover:bg-primary-50 text-primary-600">
                  <Camera className="w-3.5 h-3.5" /> Re-capture
                </button>
              </div>
            )}
          </div>

          {/* Tips */}
          <div className="card p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Tips for a good report</h4>
            <ul className="space-y-2">
              {[
                'Take a clear photo of the actual issue',
                'Date, time & GPS will be auto-stamped',
                'AI checks if image matches issue type',
                'Describe severity and exact location',
              ].map((tip) => (
                <li key={tip} className="flex items-start gap-2 text-xs text-gray-500">
                  <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportIssuePage;
