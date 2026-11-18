'use client'

import { Button } from '@heroui/react/button';
import { Input } from '@heroui/react/input';
import { MinusIcon, PlusIcon } from 'lucide-react';
import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react'

export interface PollingRef {
    getData: () => { question: string; options: string[] };
    reset: () => void;
}

export default forwardRef<PollingRef>(function Polling(_, ref) {
    const [question, setQuestion] = useState('')
    const [options, setOptions] = useState(['Pilihan pertama', 'Pilihan kedua'])
    const optionRefs = useRef<Array<HTMLInputElement | null>>([])
    const previousOptionCount = useRef(options.length)

    useEffect(() => {
        if (options.length > previousOptionCount.current) {
            optionRefs.current[options.length - 1]?.focus()
        }
        previousOptionCount.current = options.length
    }, [options.length])

    useImperativeHandle(ref, () => ({
        getData: () => ({
            question,
            options: options.filter(opt => opt.trim() !== ''),
        }),
        reset: () => {
            setQuestion('')
            setOptions(['Pilihan pertama', 'Pilihan kedua'])
        },
    }))

    function addOption() {
        setOptions((current) => [...current, ''])
    }

    function removeOption(index: number) {
        setOptions((current) => current.filter((_, optionIndex) => optionIndex !== index))
        requestAnimationFrame(() => {
            optionRefs.current[Math.max(0, index - 1)]?.focus()
        })
    }

    function updateOption(index: number, value: string) {
        setOptions((current) => current.map((option, optionIndex) => (optionIndex === index ? value : option)))
    }

    return (
        <main className="text-foreground">
            <section className="mx-auto flex w-full max-w-xl flex-col gap-8">

                <div className="flex flex-col gap-3">
                    <label htmlFor="poll-question" className="text-sm font-medium">Pertanyaan</label>
                    <Input
                        id="poll-question"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="Tulis pertanyaan polling..."
                        className="h-11 rounded-lg border border-gray-600 px-3 text-sm outline-none transition bg-transparent text-white"
                    />
                </div>

                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium" htmlFor="poll-option-0">Pilihan jawaban</label>
                        <span className="text-xs text-muted-foreground">{options.length} opsi</span>
                    </div>
                    <div className="flex flex-col gap-3" role="group" aria-label="Opsi polling">
                        {options.map((option, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted font-mono text-xs text-muted-foreground" aria-hidden="true">{index + 1}</span>
                                <Input
                                    ref={(element) => { optionRefs.current[index] = element }}
                                    id={`poll-option-${index}`}
                                    type="text"
                                    value={option}
                                    onChange={(event) => updateOption(index, event.target.value)}
                                    placeholder={`Opsi ${index + 1}`}
                                    aria-label={`Opsi polling ${index + 1}`}
                                    className="h-11 min-w-0 flex-1 rounded-lg border border-gray-600 px-3 text-sm outline-none transition bg-transparent text-white"
                                />
                                {index === options.length - 1 &&
                                    <Button type="button" size="md" variant="outline" onClick={() => removeOption(index)} isDisabled={options.length <= 2} aria-label={`Hapus opsi polling ${index + 1}`} className="text-white border border-gray-600">
                                        <MinusIcon />
                                    </Button>
                                }
                                {index === options.length - 1 &&
                                    <Button type="button" size="md" variant="outline" onClick={addOption} aria-label="Tambah opsi polling" className="text-white border border-gray-600">
                                        <PlusIcon />
                                    </Button>
                                }
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </main>
    )
})
