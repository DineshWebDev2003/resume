import { detectATS } from './detector';
import { greenhousePatterns, greenhouseSelectors } from './greenhouse';
import { leverPatterns, leverSelectors } from './lever';
import { workdayPatterns, workdaySelectors } from './workday';
import { genericPatterns, RISKY_QUESTION_KEYS } from './generic';
import type {
  ATSKind,
  MinimalApplyProfile,
  QuickApplyField,
} from './types';

export { detectATS };

const ADAPTERS: Record<string, { patterns: Record<QuickApplyField, string[]>; selectors: string[] }> = {
  greenhouse: { patterns: greenhousePatterns, selectors: greenhouseSelectors },
  lever: { patterns: leverPatterns, selectors: leverSelectors },
  workday: { patterns: workdayPatterns, selectors: workdaySelectors },
  generic: { patterns: genericPatterns, selectors: [] },
  unknown: { patterns: genericPatterns, selectors: [] },
};

export function patternsForATS(ats: ATSKind): Record<QuickApplyField, string[]> {
  const base = ADAPTERS[ats] || ADAPTERS.generic;
  // Merge generic underneath so adapter-specific keys win but coverage stays broad.
  const out = {} as Record<QuickApplyField, string[]>;
  (Object.keys(genericPatterns) as QuickApplyField[]).forEach((f) => {
    out[f] = Array.from(new Set([...(base.patterns[f] || []), ...genericPatterns[f]]));
  });
  return out;
}

export function selectorsForATS(ats: ATSKind): string[] {
  return (ADAPTERS[ats] || ADAPTERS.generic).selectors;
}

const esc = (s: string) =>
  (s || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, ' ').replace(/\r/g, ' ').slice(0, 500);

/**
 * Controlled single-run scan + fill. Native re-injects on:
 * page load / navigation / user tapping Autofill (multi-step safe).
 * Never loops internally; the MutationObserver below only REPORTS new
 * fields, it never fills by itself.
 */
export function buildSmartAutofillJS(profile: MinimalApplyProfile, ats: ATSKind): string {
  const patterns = patternsForATS(ats);
  const adapterSelectors = selectorsForATS(ats);
  const P = `
    var PROFILE = {
      firstName: '${esc(profile.firstName)}',
      lastName: '${esc(profile.lastName)}',
      fullName: '${esc(profile.fullName)}',
      email: '${esc(profile.email)}',
      phone: '${esc(profile.phone)}',
      location: '${esc(profile.location)}',
      city: '${esc(profile.city)}',
      linkedin: '${esc(profile.linkedin)}',
      portfolio: '${esc(profile.portfolio)}',
      github: '${esc(profile.github)}',
      website: '${esc(profile.website)}'
    };
    var PATTERNS = ${JSON.stringify(patterns)};
    var RISKY = ${JSON.stringify(RISKY_QUESTION_KEYS)};
    var ATS = '${ats}';
  `;

  return `(function(){${P}
  function norm(s){return String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'');}
  function qAll(sel){try{return Array.prototype.slice.call(document.querySelectorAll(sel));}catch(e){return[];}}
  function post(o){try{window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(JSON.stringify(o));}catch(e){}}
  function setVal(el,val){
    if(!el||!val) return false;
    try{
      el.focus&&el.focus();
      var tag=(el.tagName||'').toUpperCase();
      var proto=tag==='TEXTAREA'?window.HTMLTextAreaElement.prototype:(window.HTMLInputElement?window.HTMLInputElement.prototype:null);
      if(proto){var d=Object.getOwnPropertyDescriptor(proto,'value');if(d&&d.set){d.set.call(el,val);}}
      else{el.value=val;}
      ['input','change'].forEach(function(t){try{el.dispatchEvent(new Event(t,{bubbles:true}));}catch(e){}});
      try{var ne=new Event('blur',{bubbles:true});el.dispatchEvent(ne);}catch(e){}
      return true;
    }catch(e){try{el.value=val;return true;}catch(_){return false;}}
  }
  function labelText(el){
    try{
      var id=el.id;
      if(id){var l=document.querySelector('label[for="'+id+'"]');if(l&&l.innerText)return l.innerText;}
      var p=el.parentElement;
      for(var i=0;i<4&&p;i++){var ll=p.querySelector? p.querySelector('label'):null;if(ll&&ll.innerText)return ll.innerText;p=p.parentElement;}
      if(el.closest){var f=el.closest('label');if(f&&f.innerText)return f.innerText;}
    }catch(e){}
    return '';
  }
  function surroundingText(el){
    try{
      var p=el.parentElement;var t='';
      for(var i=0;i<3&&p;i++){t+=' '+(p.innerText||'').slice(0,300);p=p.parentElement;}
      return t;
    }catch(e){return '';}
  }
  function signals(el){
    var auto=norm(el.getAttribute&&el.getAttribute('autocomplete'));
    return {
      auto: auto,
      name: norm(el.name),
      id: norm(el.id),
      ph: norm(el.placeholder),
      aria: norm(el.getAttribute&&el.getAttribute('aria-label')),
      label: norm(labelText(el)),
      around: norm(surroundingText(el)),
      type: String((el.type||'')).toLowerCase()
    };
  }
  function matchField(sig){
    var hay=[sig.name,sig.id,sig.ph,sig.aria,sig.label,sig.around].join(' ');
    // type-based fast path
    if(sig.type==='email'&&PROFILE.email) return {field:'email',by:'type'};
    if(sig.type==='tel'&&PROFILE.phone) return {field:'phone',by:'type'};
    if(sig.type==='url'){
      if(/linkedin/.test(hay)&&PROFILE.linkedin) return {field:'linkedin',by:'type'};
      if(/github/.test(hay)&&PROFILE.github) return {field:'github',by:'type'};
      if(PROFILE.portfolio) return {field:'portfolio',by:'type'};
      return null;
    }
    // autocomplete fast path
    if(sig.auto){
      if(/email/.test(sig.auto)&&PROFILE.email) return {field:'email',by:'autocomplete'};
      if(/tel/.test(sig.auto)&&PROFILE.phone) return {field:'phone',by:'autocomplete'};
      if(/given-name/.test(sig.auto)&&PROFILE.firstName) return {field:'firstName',by:'autocomplete'};
      if(/family-name/.test(sig.auto)&&PROFILE.lastName) return {field:'lastName',by:'autocomplete'};
      if(/(^|_)name$/.test(sig.auto)&&PROFILE.fullName) return {field:'fullName',by:'autocomplete'};
      if(/address-level2|locality/.test(sig.auto)&&PROFILE.city) return {field:'city',by:'autocomplete'};
      if(/country-name|address/.test(sig.auto)&&PROFILE.location) return {field:'location',by:'autocomplete'};
      if(/url/.test(sig.auto)&&PROFILE.portfolio) return {field:'portfolio',by:'autocomplete'};
    }
    var fields=Object.keys(PATTERNS);
    for(var i=0;i<fields.length;i++){
      var f=fields[i];
      var keys=PATTERNS[f]||[];
      for(var k=0;k<keys.length;k++){
        var key=keys[k];
        if(!key)continue;
        var by=null;
        if(sig.name&&sig.name.indexOf(key)!==-1)by='name';
        else if(sig.id&&sig.id.indexOf(key)!==-1)by='id';
        else if(sig.ph&&sig.ph.indexOf(key)!==-1)by='placeholder';
        else if(sig.aria&&sig.aria.indexOf(key)!==-1)by='aria-label';
        else if(sig.label&&sig.label.indexOf(key)!==-1)by='label';
        else if(sig.around&&sig.around.indexOf(key)!==-1)by='surrounding';
        if(by){
          var val=PROFILE[f];
          if(val)return {field:f,by:by};
        }
      }
    }
    return null;
  }
  // ---- page signals (captcha / login / upload / confirmation) ----
  function detectSignals(){
    var captcha=false;
    try{
      captcha=!!(document.querySelector('iframe[src*="recaptcha"],iframe[src*="hcaptcha"],[data-sitekey],.g-recaptcha,.h-captcha,[data-turnstile],iframe[title*="captcha" i]')||
        /i\\u2019m not a robot|select all images|verify you are human/i.test(document.body?document.body.innerText.slice(0,4000):''));
    }catch(e){}
    var loginRequired=false;
    try{
      var pw=qAll('input[type="password"]');
      loginRequired=pw.length>0||/log in to apply|sign in to apply|login required/i.test(document.body?document.body.innerText.slice(0,4000):'');
    }catch(e){}
    var fileInputs=qAll('input[type="file"]').length;
    var url=location.href,title=document.title||'';
    var body=(document.body?document.body.innerText:'').slice(0,6000).toLowerCase();
    var confHigh=['application submitted','application received','successfully applied','your application has been received','application complete'];
    var confMed=['thank you','application confirmation'];
    var conf=confHigh.some(function(p){return body.indexOf(p)!==-1;})?'high':(confMed.some(function(p){return body.indexOf(p)!==-1;})?'medium':'low');
    var urlConf=/thank|success|applied|confirmation|submitted|congrat/.test((url+' '+title).toLowerCase())?'medium':'low';
    var confirmation=conf==='high'||(conf==='medium'&&urlConf!=='low');
    var confidence=conf==='high'?'high':(confirmation?'medium':'low');
    return {captcha:captcha,loginRequired:loginRequired,fileInputs:fileInputs,confirmation:confirmation,confidence:confidence,url:url,title:title};
  }
  // ---- risky question detection (never autofill) ----
  function detectQuestions(){
    var out=[];
    try{
      var seen={};
      function push(id,label,kind,reason){if(!label||seen[id])return;seen[id]=1;out.push({id:id,label:String(label).slice(0,160),kind:kind,reason:reason});}
      qAll('select').forEach(function(s,i){
        var lab=labelText(s)||s.name||('Question '+(i+1));
        var hay=norm(lab+' '+(s.name||'')+' '+(s.id||''));
        if(RISKY.some(function(r){return hay.indexOf(r)!==-1;}))push('sel_'+i,lab,'select','Please answer this question.');
      });
      var radios={};
      qAll('input[type="radio"]').forEach(function(r){
        var n=r.name||r.id||'radio';(radios[n]=radios[n]||[]).push(r);
      });
      Object.keys(radios).forEach(function(n){
        var hay=norm(n+' '+surroundingText(radios[n][0]));
        if(RISKY.some(function(r){return hay.indexOf(r)!==-1;}))push('radio_'+n,n.replace(/_/g,' '),'radio','Please answer this question.');
      });
      qAll('input[type="checkbox"]').forEach(function(c,i){
        var lab=labelText(c)||c.name||'';
        var hay=norm(lab+' '+(c.name||'')+' '+(c.id||''));
        if(/agree|consent|acknowledge|terms|privacy/.test(hay))return; // standard consent, not risky
        if(RISKY.some(function(r){return hay.indexOf(r)!==-1;}))push('chk_'+i,lab||('Checkbox '+(i+1)),'checkbox','Please answer this question.');
      });
      // open textareas with risky prompts (salary, sponsorship...)
      qAll('input[type="text"],textarea').forEach(function(el,i){
        var hay=norm(labelText(el)+' '+(el.name||'')+' '+(el.id||'')+' '+(el.placeholder||''));
        if(/visa|sponsorship|salary_expect|expected_salary|notice_period|work_authoriz/.test(hay))push('txt_'+i,(labelText(el)||el.placeholder||('Field '+(i+1))),'text','Please answer this question.');
      });
    }catch(e){}
    return out.slice(0,20);
  }
  // ---- main fill ----
  var fields=[];var filled=0;var skipped=0;
  var sig0=detectSignals();
  if(sig0.captcha){post({type:'captcha',ats:ATS,url:sig0.url});}
  if(sig0.loginRequired){post({type:'login-required',ats:ATS,url:sig0.url});}
  if(sig0.fileInputs>0){post({type:'resume-upload-required',ats:ATS,fileInputs:sig0.fileInputs,url:sig0.url});}
  var inputs=qAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([type="password"]),textarea');
  inputs.forEach(function(el){
    try{
      if(el.value)return; // never overwrite user data
      if(el.disabled||el.readOnly){skipped++;return;}
      var sig=signals(el);
      var m=matchField(sig);
      if(!m){skipped++;return;}
      var val=PROFILE[m.field];
      if(!val){skipped++;fields.push({field:m.field,matchedBy:m.by,success:false});return;}
      var ok=setVal(el,val);
      fields.push({field:m.field,matchedBy:m.by,success:!!ok});
      if(ok)filled++;else skipped++;
    }catch(e){skipped++;}
  });
  var questions=detectQuestions();
  var sig1=detectSignals();
  post({type:'autofill-result',ats:ATS,filled:filled,skipped:skipped,fields:fields,questions:questions,
    fileInputs:sig1.fileInputs,captcha:sig1.captcha,loginRequired:sig1.loginRequired,
    confirmation:sig1.confirmation,confidence:sig1.confidence,url:sig1.url});
  if(sig1.confirmation&&sig1.confidence==='high'){post({type:'confirmation',ats:ATS,confidence:'high',url:sig1.url,text:document.title});}
  return filled;
})();true;`;
}

/** Lightweight signal-only scan (no filling) — posted on page load. */
export function buildSignalScanJS(ats: ATSKind): string {
  return `(function(){
  function post(o){try{window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(JSON.stringify(o));}catch(e){}}
  try{
    var body=(document.body?document.body.innerText:'').slice(0,6000).toLowerCase();
    var captcha=!!document.querySelector('iframe[src*="recaptcha"],iframe[src*="hcaptcha"],[data-sitekey],.g-recaptcha,.h-captcha');
    var loginRequired=document.querySelectorAll('input[type="password"]').length>0;
    var fileInputs=document.querySelectorAll('input[type="file"]').length;
    var inputs=document.querySelectorAll('input:not([type="hidden"]),textarea,select').length;
    var conf=/application submitted|application received|successfully applied|your application has been received/.test(body)?'high':(/thank you|application confirmation/.test(body)?'medium':'low');
    post({type:'page-signals',ats:'${ats}',captcha:captcha,loginRequired:loginRequired,fileInputs:fileInputs,fieldCount:inputs,confidence:conf,url:location.href,title:document.title});
  }catch(e){}
})();true;`;
}
