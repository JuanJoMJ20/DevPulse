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
      QueryFullProcessImageNameW: kernel32.func(
        'bool __stdcall QueryFullProcessImageNameW(void* h, uint32 flags, _Out_ uint8_t* buf, _Inout_ uint32* size)',
      ),
    }
  } catch {
    return () => null
  }

  const PROCESS_QUERY_LIMITED_INFORMATION = 0x1000
  const titleBuf = Buffer.alloc(512 * 2)
  const pathBuf = Buffer.alloc(1024 * 2)

  return function readForeground() {
    try {
      const hwnd = api.GetForegroundWindow()
      if (!hwnd) return null

      const len = api.GetWindowTextW(hwnd, titleBuf, 512)
      const title = titleBuf.toString('utf16le', 0, len * 2)

