const path = require('node:path')

/**
 * Lee la ventana en primer plano mediante la API de Windows (user32/kernel32)
 * con koffi, sin compilar nada ni lanzar procesos.
 */
function createForegroundReader() {
  if (process.platform !== 'win32') return () => null

  let api
  try {
    const koffi = require('koffi')
    const user32 = koffi.load('user32.dll')
    const kernel32 = koffi.load('kernel32.dll')
    api = {
      GetForegroundWindow: user32.func('void* __stdcall GetForegroundWindow()'),
      GetWindowTextW: user32.func('int __stdcall GetWindowTextW(void* hWnd, _Out_ uint8_t* buf, int max)'),
      GetWindowThreadProcessId: user32.func('uint32 __stdcall GetWindowThreadProcessId(void* hWnd, _Out_ uint32* pid)'),
      OpenProcess: kernel32.func('void* __stdcall OpenProcess(uint32 access, bool inherit, uint32 pid)'),
      CloseHandle: kernel32.func('bool __stdcall CloseHandle(void* h)'),
