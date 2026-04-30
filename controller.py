import time
import threading
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

try:
    from pynput.keyboard import Key, Controller
    kb = Controller()
except ImportError:
    print("====================================")
    print("XATOLIK: pynput moduli o'rnatilmagan.")
    print("Iltimos terminalda yozing: pip install pynput")
    print("====================================")
    exit()

current_action = "center"
gas_pressed = False
brake_pressed = False

class RequestHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        global current_action, gas_pressed, brake_pressed
        parsed_path = urlparse(self.path)
        if parsed_path.path == '/steer':
            qs = parse_qs(parsed_path.query)
            if 'action' in qs:
                current_action = qs['action'][0]
            if 'gas' in qs:
                gas_pressed = (qs['gas'][0].lower() == 'true')
            if 'brake' in qs:
                brake_pressed = (qs['brake'][0].lower() == 'true')
        
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(b'{"status":"ok"}')
        
    def log_message(self, format, *args):
        pass

def key_presser():
    global current_action, gas_pressed, brake_pressed
    print("Dastur tayyor! O'yin oynasini Active qilishni unutmang!")
    left_act = False
    right_act = False
    gas_act = False
    brake_act = False
    
    while True:
        # LEFT
        if current_action == "left":
            if right_act:
                kb.release(Key.right)
                kb.release('d')
                right_act = False
            if not left_act:
                kb.press(Key.left)
                kb.press('a')
                left_act = True
        # RIGHT
        elif current_action == "right":
            if left_act:
                kb.release(Key.left)
                kb.release('a')
                left_act = False
            if not right_act:
                kb.press(Key.right)
                kb.press('d')
                right_act = True
        # CENTER
        else:
            if left_act:
                kb.release(Key.left)
                kb.release('a')
                left_act = False
            if right_act:
                kb.release(Key.right)
                kb.release('d')
                right_act = False

        # GAS
        if gas_pressed and not gas_act:
            kb.press(Key.up)
            kb.press('w')
            gas_act = True
        elif not gas_pressed and gas_act:
            kb.release(Key.up)
            kb.release('w')
            gas_act = False

        # BRAKE
        if brake_pressed and not brake_act:
            kb.press(Key.down)
            kb.press('s')
            brake_act = True
        elif not brake_pressed and brake_act:
            kb.release(Key.down)
            kb.release('s')
            brake_act = False
            
        time.sleep(0.01)

if __name__ == '__main__':
    t = threading.Thread(target=key_presser, daemon=True)
    t.start()
    
    server_address = ('', 5000)
    httpd = HTTPServer(server_address, RequestHandler)
    print("====================================")
    print("Server http://localhost:5000 ishga tushdi...")
    print("O'yinlar uchun ARROWS (up,down..) VA W,A,S,D harflari baravar bosiladi!")
    print("Barcha web va PC o'yinlariga mos keladi.")
    print("To'xtatish uchun: Ctrl+C")
    print("====================================")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    
    # Release everything on exit
    kb.release(Key.left)
    kb.release('a')
    kb.release(Key.right)
    kb.release('d')
    kb.release(Key.up)
    kb.release('w')
    kb.release(Key.down)
    kb.release('s')
