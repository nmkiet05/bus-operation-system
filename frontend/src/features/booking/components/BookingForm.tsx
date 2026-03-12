import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { CreditCard, Wallet } from 'lucide-react';

export function BookingForm() {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-xl mb-6 text-brand-blue">Thông tin hành khách</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="space-y-2">
                    <Label>Họ và tên</Label>
                    <Input placeholder="Nguyễn Văn A" />
                </div>
                <div className="space-y-2">
                    <Label>Số điện thoại</Label>
                    <Input placeholder="0912345678" />
                </div>
                <div className="space-y-2 md:col-span-2">
                    <Label>Email</Label>
                    <Input placeholder="email@example.com" />
                </div>
            </div>

            <h3 className="font-bold text-xl mb-4 text-brand-blue mt-8">Thanh toán</h3>
            <RadioGroup defaultValue="momo" className="space-y-3">
                <div className="flex items-center space-x-2 border p-4 rounded-lg cursor-pointer hover:border-brand-blue transition-colors">
                    <RadioGroupItem value="momo" id="momo" />
                    <Label htmlFor="momo" className="flex items-center gap-2 cursor-pointer flex-1">
                        <Wallet className="h-5 w-5 text-pink-600" />
                        <span>Ví MoMo</span>
                    </Label>
                    <Image src="/images/momo-logo.png" alt="MoMo" width={24} height={24} className="object-contain" />
                </div>
                <div className="flex items-center space-x-2 border p-4 rounded-lg cursor-pointer hover:border-brand-blue transition-colors">
                    <RadioGroupItem value="vnpay" id="vnpay" />
                    <Label htmlFor="vnpay" className="flex items-center gap-2 cursor-pointer flex-1">
                        <CreditCard className="h-5 w-5 text-blue-600" />
                        <span>VNPay QR</span>
                    </Label>
                </div>
            </RadioGroup>

            <Button className="w-full mt-8 h-12 text-lg font-bold bg-brand-blue hover:bg-sky-700">
                THANH TOÁN (600.000đ)
            </Button>
        </div>
    );
}
