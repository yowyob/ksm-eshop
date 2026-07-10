(async () => {
  try {
    const { getKernelHeaders } = await import('./src/lib/kernel-auth.js');
    const headers = await getKernelHeaders();
    console.log("Headers OK");
  } catch(e) {
    console.log("Error loading headers", e);
  }
})();
