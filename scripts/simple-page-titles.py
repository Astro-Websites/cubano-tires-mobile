"""One-off: Tina lists pages by title, so titles become short names and the full
browser/Google title moves to seoTitle (unchanged on the live pages)."""
from designed_pages import load_all, save
NAMES = {
    'homepage': 'Homepage', 'about-us': 'About Us', 'coupons': 'Coupons',
    'anaheim': 'Anaheim', 'irvine': 'Irvine', 'tesla-ev-tires': 'Tesla & EV Tires',
    'commercial-truck-tires': 'Commercial Truck Tires', 'flat-tire-repair': 'Flat Tire Repair',
    'fleet-tire-service': 'Fleet Tire Service', 'mobile-tire-installation': 'Mobile Tire Installation',
    'otr-heavy-equipment-tires': 'OTR & Heavy Equipment Tires', 'roadside-tire-service': 'Roadside Tire Service',
    'run-flat-tires': 'Run-Flat Tires', 'tire-mounting': 'Tire Mounting',
    'tire-rotation-balancing': 'Tire Rotation & Balancing', 'tpms-sensor-service': 'TPMS Sensor Service',
}
for page in load_all():
    d = page['data']
    if 'seoTitle' in d: continue
    full = d['title']
    page['data'] = {'title': NAMES[page['md'].stem], 'seoTitle': full, **{k: v for k, v in d.items() if k != 'title'}}
    save(page)
