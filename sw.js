self.addEventListener('fetch', e => {
  e.respondWith(
    caches.open('gym').then(c =>
      c.match(e.request).then(r => r || fetch(e.request).then(res => {
        c.put(e.request, res.clone());
        return res;
      }))
    )
  );
});
