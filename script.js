(()=>{
  'use strict';
  const header=document.getElementById('siteHeader');
  const cover=document.getElementById('home');
  const dock=document.getElementById('playerDock');
  const menu=document.getElementById('menuToggle');
  const nav=document.getElementById('primaryNav');
  const videoDialog=document.getElementById('videoDialog');
  const frame=document.getElementById('videoFrame');
  const photoDialog=document.getElementById('photoDialog');
  const photoFull=document.getElementById('photoFull');
  const photoCaption=document.getElementById('photoCaption');
  let videoOpener=null,photoOpener=null;
  let primaryVideoId='YJetxJSttx4';
  const updateHeader=()=>{
    const pastCover=window.scrollY>Math.max(160,cover.offsetHeight-130);
    header.classList.toggle('visible',pastCover || window.innerWidth<=768);
    if(!dock.classList.contains('dismissed'))dock.classList.toggle('visible',pastCover);
  };
  updateHeader();window.addEventListener('scroll',updateHeader,{passive:true});window.addEventListener('resize',updateHeader,{passive:true});
  document.getElementById('currentYear').textContent=new Date().getFullYear();
  const closeMenu=()=>{nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Открыть меню')};
  menu.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Закрыть меню':'Открыть меню')});
  nav.querySelectorAll('a').forEach(link=>link.addEventListener('click',closeMenu));
  window.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu()});
  document.querySelectorAll('[data-play-video]').forEach(btn=>btn.addEventListener('click',()=>{
    videoOpener=btn;
    frame.innerHTML=`<iframe src="https://www.youtube-nocookie.com/embed/${primaryVideoId}?rel=0" title="TAXI BLUES — Овцы Христа (официальный клип)" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen loading="lazy"></iframe>`;
    if(typeof videoDialog.showModal==='function')videoDialog.showModal();else videoDialog.setAttribute('open','');
  }));
  const closeVideo=()=>{if(videoDialog.open)videoDialog.close();frame.replaceChildren();videoOpener?.focus()};
  document.querySelector('[data-close-video]').addEventListener('click',closeVideo);
  videoDialog.addEventListener('cancel',()=>{frame.replaceChildren();videoOpener?.focus()});
  videoDialog.addEventListener('click',e=>{if(e.target===videoDialog)closeVideo()});
  document.querySelectorAll('[data-photo]').forEach(btn=>btn.addEventListener('click',()=>{
    photoOpener=btn;photoFull.src=btn.dataset.photo;photoFull.alt=btn.dataset.caption || 'Фотография TAXI BLUES';photoCaption.textContent=btn.dataset.caption || '';
    if(typeof photoDialog.showModal==='function')photoDialog.showModal();else photoDialog.setAttribute('open','');
  }));
  const closePhoto=()=>{if(photoDialog.open)photoDialog.close();photoFull.removeAttribute('src');photoOpener?.focus()};
  document.querySelector('[data-close-photo]').addEventListener('click',closePhoto);
  photoDialog.addEventListener('click',e=>{if(e.target===photoDialog)closePhoto()});
  photoDialog.addEventListener('close',()=>photoFull.removeAttribute('src'));
  document.getElementById('dockDismiss').addEventListener('click',()=>{dock.classList.add('dismissed')});
  if('IntersectionObserver' in window){
    const sections=[...document.querySelectorAll('main section[id]')];
    const links=[...nav.querySelectorAll('a[href^="#"]')];
    const observer=new IntersectionObserver(entries=>{
      const current=entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
      if(current){links.forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+current.target.id))}
    },{rootMargin:'-22% 0px -58% 0px',threshold:[0,.1,.3,.7]});sections.forEach(s=>observer.observe(s));
  }
  // Data-driven content managed through Pages CMS. Existing HTML remains a local-file fallback.
  const cmsFetch=async file=>{
    if(location.protocol==='file:')return null;
    try{
      const res=await fetch('content/'+file+'.json',{cache:'no-store'});
      if(!res.ok)throw new Error('HTTP '+res.status);
      return await res.json();
    }catch(err){console.warn('TAXI BLUES: content not loaded:',file,err);return null}
  };
  const published=data=>Array.isArray(data)?data.filter(x=>x && x.published!==false).sort((a,b)=>(Number(a.order)||9999)-(Number(b.order)||9999)):[];
  const safeMedia=s=>typeof s==='string' && (/^(?:assets\/|\.\/assets\/|\/assets\/)/.test(s)||/^https:\/\/[^\s]+$/.test(s))?s:'';
  const safeExternal=s=>typeof s==='string' && /^https:\/\/[^\s]+$/.test(s)?s:'';
  const putText=(el,tag,t)=>{const n=document.createElement(tag);n.textContent=t;el.append(n);return n};
  const albumDescription=document.getElementById('albumDescription');
  cmsFetch('albums').then(data=>{
    const albums=published(data);if(!albums.length)return;
    const first=albums[0];
    const heading=document.querySelector('.music-info h2');
    if(first.title)heading.textContent=first.title;
    if(typeof first.description==='string'&&first.description.trim()){
      albumDescription.replaceChildren();
      first.description.trim().split(/\n\s*\n/).forEach(p=>putText(albumDescription,'p',p.trim()));
    }
    const listen=document.querySelector('.music-actions a');
    const url=safeExternal(first.listen_url);
    if(url)listen.href=url;
    const cover=safeMedia(first.cover);
    if(cover)document.querySelector('.album-poster-illustration').style.backgroundImage='url('+JSON.stringify(cover)+')';
    const others=albums.slice(1),target=document.getElementById('moreAlbums');
    others.forEach(a=>{
      const card=document.createElement('div');card.className='album-extra';
      putText(card,'h3',a.title||'Альбом');
      if(a.description)putText(card,'p',a.description);
      const link=safeExternal(a.listen_url);
      if(link){const el=document.createElement('a');el.href=link;el.target='_blank';el.rel='noopener noreferrer';el.className='text-link';el.textContent='Слушать на площадках ↗';card.append(el)}
      target.append(card);
    });
  });
  const audio=document.getElementById('musicAudio');
  const tracksList=document.getElementById('tracksList');
  const nowPlaying=document.getElementById('nowPlaying');
  cmsFetch('tracks').then(data=>{
    const tracks=published(data);if(!tracks.length)return;
    document.getElementById('tracksEmpty').hidden=true;
    tracksList.replaceChildren();
    const playable=tracks.filter(t=>safeMedia(t.audio));
    let currentIndex=-1;
    const buttons=[];
    const playAt=index=>{
      if(index<0||index>=playable.length)return;
      currentIndex=index;
      const track=playable[index];
      const src=safeMedia(track.audio);
      if(!src)return;
      if(audio.getAttribute('src')!==src){audio.src=src;audio.load()}
      audio.dataset.track=track.title||'Песня TAXI BLUES';
      audio.hidden=false;
      nowPlaying.textContent='Сейчас играет: '+audio.dataset.track;
      buttons.forEach(btn=>btn.setAttribute('aria-pressed',String(btn.dataset.src===src)));
      audio.play().catch(()=>{nowPlaying.textContent='Нажмите Play для воспроизведения: '+audio.dataset.track});
    };
    tracks.forEach(track=>{
      const li=document.createElement('li');
      const sound=safeMedia(track.audio), title=track.title||'Без названия';
      if(sound){
        const btn=document.createElement('button');btn.type='button';btn.className='track-play';
        btn.textContent='▶ '+title;btn.dataset.src=sound;
        btn.setAttribute('aria-pressed','false');
        btn.addEventListener('click',()=>playAt(playable.findIndex(t=>safeMedia(t.audio)===sound)));
        buttons.push(btn);li.append(btn);
      }else{
        putText(li,'span',title+' — аудио скоро появится');
      }
      tracksList.append(li);
    });
    if(playable.length>1){
      const actions=document.createElement('div');actions.className='playlist-actions';
      const prev=document.createElement('button');prev.type='button';prev.className='track-play';
      prev.textContent='← Предыдущая';prev.addEventListener('click',()=>playAt(currentIndex>0?currentIndex-1:playable.length-1));
      const next=document.createElement('button');next.type='button';next.className='track-play';
      next.textContent='Следующая →';next.addEventListener('click',()=>playAt(currentIndex<0?0:(currentIndex+1)%playable.length));
      actions.append(prev,next);audio.insertAdjacentElement('afterend',actions);
      audio.addEventListener('ended',()=>{
        if(currentIndex>=0 && currentIndex<playable.length-1)playAt(currentIndex+1);
        else if(currentIndex===playable.length-1)nowPlaying.textContent='Альбом завершён: '+(playable[currentIndex].title||'TAXI BLUES');
      });
    }
  });
  const photoGrid=document.getElementById('galleryGrid');
  cmsFetch('photos').then(data=>{
    const photos=published(data).filter(p=>safeMedia(p.image));
    if(!photos.length)return;
    photoGrid.replaceChildren();
    photos.forEach((p,i)=>{
      const b=document.createElement('button');b.type='button';b.className='photo-tile'+(i===0?' photo-wide':'');
      const url=safeMedia(p.image);b.dataset.photo=url;b.dataset.caption=p.title||'';
      const img=document.createElement('img');img.src=url;img.alt=p.title||'Фото TAXI BLUES';img.loading='lazy';b.append(img);
      putText(b,'span',p.title||p.category||'Фотография');
      b.addEventListener('click',()=>{photoOpener=b;photoFull.src=url;photoFull.alt=p.title||'TAXI BLUES';photoCaption.textContent=p.title||'';photoDialog.showModal()});
      photoGrid.append(b);
    });
  });
  cmsFetch('videos').then(data=>{
    const videos=published(data);if(!videos.length)return;
    const primary=videos[0];
    const raw=safeExternal(primary.youtube_url);
    if(raw){
      try{
        const parsed=new URL(raw);let id='';
        if(parsed.hostname==='youtu.be')id=parsed.pathname.slice(1);
        if(parsed.hostname==='youtube.com'||parsed.hostname==='www.youtube.com'){
          id=parsed.searchParams.get('v')||'';
          if(!id&&parsed.pathname.startsWith('/shorts/'))id=parsed.pathname.split('/')[2];
        }
        if(/^[A-Za-z0-9_-]{11}$/.test(id))primaryVideoId=id;
        document.querySelector('.video-detail h2').textContent=primary.title||'Клип';
        document.querySelector('.video-detail a[href*="youtube.com/watch"]').href=raw;
      }catch(e){}
    }
    const target=document.getElementById('additionalVideos');
    videos.slice(1).forEach(v=>{
      const link=safeExternal(v.youtube_url);if(!link)return;
      const card=document.createElement('a');card.className='video-more-link';card.href=link;card.target='_blank';card.rel='noopener noreferrer';
      putText(card,'strong',v.title||'Клип');putText(card,'span',v.description||'Смотреть на YouTube ↗');target.append(card);
    });
  });
  cmsFetch('news').then(data=>{
    const news=published(data);if(!news.length)return;
    const target=document.getElementById('newsPosts');target.classList.add('news-posts');
    document.querySelector('.news-section .body-lead').textContent='Последние публикации и анонсы TAXI BLUES.';
    news.forEach(n=>{
      const article=document.createElement('article');article.className='news-post';
      if(n.date)putText(article,'time',n.date);
      putText(article,'h3',n.title||'Новость');
      if(n.text)putText(article,'p',n.text);
      const picture=safeMedia(n.image);
      if(picture){const img=document.createElement('img');img.src=picture;img.alt=n.title||'Иллюстрация';img.loading='lazy';article.prepend(img)}
      target.append(article);
    });
  });

})();