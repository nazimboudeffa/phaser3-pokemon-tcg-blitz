import { energyCards } from '../data/energyCards.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super("GameScene");
    }

    preload() {
        // Charge dynamiquement toutes les images d'énergies "Basic" depuis energyCards.js
        const basicEnergies = energyCards.filter(card => card.supertype === 'Energy' && card.subtypes.includes('Basic'));
        basicEnergies.forEach(card => {
            this.load.image(card.id, card.images.small);
        });
    }

    create() {
        const player = this.registry.get("playerPokemon");
        const ai = this.registry.get("aiPokemon");

            this.gameOver = false;

        // Fond
        this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x1e1e1e).setOrigin(0);

        const centerY = this.scale.height / 2;

        // UI Cards
        this.playerUI = this.createHorizontalCard(
            player,
            this.scale.width * 0.25,
            centerY,
            true
        );

        this.aiUI = this.createHorizontalCard(
            ai,
            this.scale.width * 0.75,
            centerY,
            false
        );

        /* =======================
           BOUTON D'ATTAQUE
        ======================= */
        this.createAttackButton();

        // Sauvegarde des HP
        this.playerHP = player.hp;
        this.aiHP = ai.hp;

        // =======================
        // PIOCHES D'ENERGIES (12 cartes chacune)
        // =======================
        // Joueur
        const basicEnergies = energyCards.filter(card => card.supertype === 'Energy' && card.subtypes.includes('Basic'));
        this.playerEnergyDeck = [];
        for (let i = 0; i < 10; i++) {
            // Distribution aléatoire d'énergies de base
            const energy = basicEnergies[Math.floor(Math.random() * basicEnergies.length)];
            this.playerEnergyDeck.push({ ...energy });
        }
        this.checkEndGame();
        this.playerEnergyDeckSprites = [];
        this.playerEnergyHand = [];
        this.playerEnergyHandSprites = [];
        const playerDeckX = 80;
        const playerDeckY = this.scale.height - 120;
        for (let i = 0; i < this.playerEnergyDeck.length; i++) {
            let offset = i * 1.5;
            let card = this.add.image(playerDeckX + offset, playerDeckY - offset, this.playerEnergyDeck[i].id)
                .setDisplaySize(48, 68)
                .setOrigin(0.5);
            this.playerEnergyDeckSprites.push(card);
        }
        this.playerEnergyDeckText = this.add.text(playerDeckX, playerDeckY + 50, `Energies: ${this.playerEnergyDeck.length}`,
            { font: "18px Arial", fill: "#fff" }).setOrigin(0.5);

        // IA
        this.aiEnergyDeck = [];
        for (let i = 0; i < 10; i++) {
            const energy = basicEnergies[Math.floor(Math.random() * basicEnergies.length)];
            this.aiEnergyDeck.push({ ...energy });
        }
        this.aiEnergyDeckSprites = [];
        this.aiEnergyHand = [];
        this.aiEnergyHandSprites = [];
        // Affichage main IA (au-dessus de la pioche IA)
        this.aiHandBaseX = this.scale.width - 80; // Point d'ancrage à droite
        this.aiHandY = 60;
        this.updateAiHandDisplay();
        const aiDeckX = this.scale.width - 80;
        const aiDeckY = 120;
        for (let i = 0; i < this.aiEnergyDeck.length; i++) {
            let offset = i * 1.5;
            let card = this.add.image(aiDeckX + offset, aiDeckY - offset, this.aiEnergyDeck[i].id)
                .setDisplaySize(48, 68)
                .setOrigin(0.5)
                .setTint(0xffa500);
            this.aiEnergyDeckSprites.push(card);
        }
        this.aiEnergyDeckText = this.add.text(aiDeckX, aiDeckY + 50, `Energies: ${this.aiEnergyDeck.length}`,
            { font: "18px Arial", fill: "#fff" }).setOrigin(0.5);

        // Gestion du tour
        this.currentTurn = "player"; // "player" ou "ai"
        this.turnText = this.add.text(this.scale.width / 2, 30, "Turn : Player", { font: "22px Arial", fill: "#fff" }).setOrigin(0.5);

        // Interaction : piocher une énergie pour le joueur (seulement si c'est son tour)
        this.playerEnergyDeckSprites.forEach((sprite, idx) => {
            sprite.setInteractive({ useHandCursor: true });
            sprite.on("pointerdown", () => {
                if (this.currentTurn === "player") {
                    this.drawEnergyCard("player");
                    this.nextTurn();
                }
            });
        });

        // Plus besoin d'interaction pour l'IA : elle pioche automatiquement à son tour

        // Affichage main joueur (sous la pioche)
        this.playerHandX = playerDeckX + 120;
        this.playerHandY = this.scale.height - 60;
        this.updatePlayerHandDisplay();

        // Attaque du joueur → IA
        this.attackButton.on("pointerdown", () => {
            this.promptAttackChoice();
        });
    }

    // Affiche une fenêtre de choix d'attaque et gère l'énergie
    promptAttackChoice() {
        const player = this.registry.get("playerPokemon");
        if (!player || !player.attacks || player.attacks.length === 0) return;

        // Crée une boîte de dialogue simple
        const dialogBg = this.add.rectangle(this.scale.width/2, this.scale.height/2, 400, 200, 0x222222, 0.95).setOrigin(0.5).setDepth(1000);
        const dialogText = this.add.text(this.scale.width/2, this.scale.height/2 - 60, "Choose an attack :", { font: "20px Arial", fill: "#fff" }).setOrigin(0.5).setDepth(1001);
        const closeDialog = () => {
            dialogBg.destroy();
            dialogText.destroy();
            attackButtons.forEach(btn => btn.destroy());
            errorText && errorText.destroy();
            closeBtn && closeBtn.destroy();
        };
        let errorText = null;
        const attackButtons = [];

        // Ajoute un bouton "Fermer"
        const closeBtn = this.add.text(this.scale.width/2, this.scale.height/2 + 100, "Close", {
            font: "18px Arial",
            fill: "#fff",
            backgroundColor: "#a33",
            padding: { x: 16, y: 6 }
        })
        .setOrigin(0.5)
        .setDepth(1001)
        .setInteractive({ useHandCursor: true });
        closeBtn.on("pointerdown", closeDialog);
        player.attacks.forEach((atk, idx) => {
            const btn = this.add.text(this.scale.width/2, this.scale.height/2 - 10 + idx*40, `${atk.name} (${atk.cost ? atk.cost.join(", ") : "-"})`, {
                font: "18px Arial",
                fill: "#fff",
                backgroundColor: "#444",
                padding: { x: 12, y: 6 }
            })
            .setOrigin(0.5)
            .setDepth(1001)
            .setInteractive({ useHandCursor: true });
            btn.on("pointerdown", () => {
                // Vérifie les énergies requises
                const cost = atk.cost || [];
                if (cost.length === 0) {
                    closeDialog();
                    this.handlePlayerAttack(atk);
                    return;
                }
                // Compte les énergies dans la main (ex: "Grass Energy" pour "Grass")
                const handCounts = {};
                this.playerEnergyHand.forEach(card => {
                    // Extrait le type d'énergie depuis le nom (ex: "Grass Energy" -> "Grass")
                    const type = card.name.replace(" Energy", "");
                    handCounts[type] = (handCounts[type] || 0) + 1;
                });
                // Compte le coût
                const costCounts = {};
                cost.forEach(type => {
                    costCounts[type] = (costCounts[type] || 0) + 1;
                });
                // Vérifie si on a assez d'énergies
                let enough = true;
                for (let type in costCounts) {
                    if ((handCounts[type] || 0) < costCounts[type]) {
                        enough = false;
                        break;
                    }
                }
                if (enough) {
                    // Retire les énergies de la main
                    for (let type in costCounts) {
                        let toRemove = costCounts[type];
                        for (let i = this.playerEnergyHand.length - 1; i >= 0 && toRemove > 0; i--) {
                            if (this.playerEnergyHand[i].name.replace(" Energy", "") === type) {
                                this.playerEnergyHand.splice(i, 1);
                                toRemove--;
                            }
                        }
                    }
                    this.updatePlayerHandDisplay();
                    closeDialog();
                    this.handlePlayerAttack(atk);
                } else {
                    if (errorText) errorText.destroy();
                    errorText = this.add.text(this.scale.width/2, this.scale.height/2 + 70, "Not enough energies!", { font: "18px Arial", fill: "#ff5555", backgroundColor: "#222" }).setOrigin(0.5).setDepth(1002);
                }
            });
            attackButtons.push(btn);
        });
    }

    /* ============================================================
        BOUTON D'ATTAQUE
    ============================================================ */
    createAttackButton() {
        this.attackButton = this.add.text(
            this.scale.width / 2,
            this.scale.height - 120,
            "ATTACK",
            {
                font: "32px Arial",
                fill: "#fff",
                backgroundColor: "#444",
                padding: { x: 20, y: 10 }
            }
        )
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

        // Hover
        this.attackButton.on("pointerover", () => {
            this.attackButton.setStyle({ backgroundColor: "#666" });
        });

        this.attackButton.on("pointerout", () => {
            this.attackButton.setStyle({ backgroundColor: "#444" });
        });
    }

    /* ============================================================
        GESTION ATTAQUE DU JOUEUR
    ============================================================ */
    // Gère l'attaque du joueur avec l'objet attaque (optionnel)
    handlePlayerAttack(attackObj) {
        let damage = 30;
        if (attackObj && attackObj.damage) {
            // Peut être une chaîne "30" ou "30+"
            const dmg = parseInt(attackObj.damage);
            if (!isNaN(dmg)) damage = dmg;
        }
        this.aiHP = Math.max(0, this.aiHP - damage);
        // Animation
        this.animateHP(this.aiUI.hpBar, this.aiUI.hpText, this.aiHP, this.registry.get("aiPokemon").hp);
        this.checkEndGame();
    }

    /* ============================================================
        ANIMATION HP DIMINUANT
    ============================================================ */
    animateHP(hpBar, hpText, newHP, maxHP) {
        const percent = newHP / maxHP;
        const newWidth = 210 * percent;

        // Tween largeur de la barre rouge
        this.tweens.add({
            targets: hpBar,
            displayWidth: newWidth,
            duration: 600,
            ease: "Cubic.easeOut"
        });

        // Met à jour le texte
        hpText.setText(`${newHP} / ${maxHP} HP`);
    }

    /* ============================================================
        UI CARD (mise à jour incluse)
    ============================================================ */
    createHorizontalCard(pokemon, x, y, isPlayer = false) {

        // Étiquette (Player/AI)
        this.add.text(x, y - 150, isPlayer ? "PLAYER" : "AI", {
            font: "24px Arial",
            fill: "#fff",
            fontStyle: "bold"
        }).setOrigin(0.5);

        // Cadre (plus petit)
        this.add.rectangle(x, y, 180, 240, isPlayer ? 0x203040 : 0x402030, 0.85)
            .setStrokeStyle(3, 0xffffff)
            .setOrigin(0.5);

        // Image (plus petite)
        this.add.image(x, y - 5, pokemon.id)
            .setDisplaySize(120, 170);

        /* ---- HP UI ---- */
        const hpMax = pokemon.hp;
        const hp = pokemon.hp;

        // Fond barre HP
        this.add.rectangle(x, y + 140, 210, 26, 0x000000, 0.6)
            .setOrigin(0.5);

        // Barre rouge (HP)
        const hpBar = this.add.rectangle(x - 105, y + 140, 210, 26, 0xff5555)
            .setOrigin(0, 0.5);

        // Texte HP
        const hpText = this.add.text(x, y + 140, `${hp} / ${hpMax} HP`, {
            font: "18px Arial",
            fill: "#fff"
        }).setOrigin(0.5);

        return { hpBar, hpText };
    }

    // Pioche une carte énergie pour le joueur ou l'IA
    drawEnergyCard(who = "player") {
        if (who === "player") {
            if (this.playerEnergyDeck.length > 0) {
                    if (this.gameOver) return;
                const card = this.playerEnergyDeck.pop();
                const cardSprite = this.playerEnergyDeckSprites.pop();
                cardSprite.destroy();
                this.playerEnergyDeckText.setText(`Energies: ${this.playerEnergyDeck.length}`);
                // Ajoute à la main du joueur
                this.playerEnergyHand.push(card);
                this.updatePlayerHandDisplay();
            }
        } else if (who === "ai") {
            if (this.aiEnergyDeck.length > 0) {
                    if (this.gameOver) return;
                const card = this.aiEnergyDeck.pop();
                const cardSprite = this.aiEnergyDeckSprites.pop();
                cardSprite.destroy();
                this.aiEnergyDeckText.setText(`Energies: ${this.aiEnergyDeck.length}`);
                // Ajoute à la main de l'IA
                this.aiEnergyHand.push(card);
                this.updateAiHandDisplay();
            }
        }
    }

    // Passe au tour suivant
    nextTurn() {
        if (this.currentTurn === "player") {
                if (this.gameOver) return;
            this.currentTurn = "ai";
            this.turnText.setText("Turn : IA");
            // L'IA pioche automatiquement après un court délai
            this.time.delayedCall(700, () => {
                this.drawEnergyCard("ai");
                // L'IA attaque si possible après un court délai
                this.time.delayedCall(700, () => {
                    this.handleAIAttack();
                    this.nextTurn();
                });
            });
        } else {
            this.currentTurn = "player";
            this.turnText.setText("Turn : Player");
        }
    }

    // L'IA attaque automatiquement si possible
    handleAIAttack() {
        const ai = this.registry.get("aiPokemon");
        if (!ai || !ai.attacks || ai.attacks.length === 0) return;
        // Cherche une attaque faisable avec les énergies en main
        for (let atk of ai.attacks) {
            const cost = atk.cost || [];
            if (cost.length === 0) {
                this.handleAIDamage(atk);
                return;
            }
            // Compte les énergies dans la main IA
            const handCounts = {};
            this.aiEnergyHand.forEach(card => {
                const type = card.name.replace(" Energy", "");
                handCounts[type] = (handCounts[type] || 0) + 1;
            });
            // Compte le coût
            const costCounts = {};
            cost.forEach(type => {
                costCounts[type] = (costCounts[type] || 0) + 1;
            });
            // Vérifie si l'IA a assez d'énergies
            let enough = true;
            for (let type in costCounts) {
                if ((handCounts[type] || 0) < costCounts[type]) {
                    enough = false;
                    break;
                }
            }
            if (enough) {
                // Retire les énergies de la main IA
                for (let type in costCounts) {
                    let toRemove = costCounts[type];
                    for (let i = this.aiEnergyHand.length - 1; i >= 0 && toRemove > 0; i--) {
                        if (this.aiEnergyHand[i].name.replace(" Energy", "") === type) {
                            this.aiEnergyHand.splice(i, 1);
                            toRemove--;
                        }
                    }
                }
                this.updateAiHandDisplay();
                this.handleAIDamage(atk);
                return;
            }
        }
        // Si aucune attaque possible, ne fait rien
    }

    // Applique les dégâts de l'attaque IA au joueur
    handleAIDamage(attackObj) {
        let damage = 30;
            if (this.gameOver) return;
        if (attackObj && attackObj.damage) {
            const dmg = parseInt(attackObj.damage);
            if (!isNaN(dmg)) damage = dmg;
        }
        this.playerHP = Math.max(0, this.playerHP - damage);
        this.animateHP(this.playerUI.hpBar, this.playerUI.hpText, this.playerHP, this.registry.get("playerPokemon").hp);
        this.checkEndGame();
    }

     // Vérifie la fin de partie : plus d'énergies à piocher et affiche le gagnant si HP différents
    checkEndGame() {
        const noMoreEnergies = this.playerEnergyDeck.length === 0 && this.aiEnergyDeck.length === 0;
        if (this.gameOver) return;
        if (noMoreEnergies) {
            if (this.playerHP > this.aiHP) {
                this.showEndGameMessage("Player wins!");
            } else if (this.aiHP > this.playerHP) {
                this.showEndGameMessage("AI wins!");
            } else {
                this.showEndGameMessage("Draw!");
            }
                this.gameOver = true;
        }
    }

    // Affiche un message de fin de partie et un bouton nouvelle partie
    showEndGameMessage(msg) {
        this.add.rectangle(this.scale.width/2, this.scale.height/2, 420, 160, 0x222222, 0.95).setOrigin(0.5).setDepth(2000);
        this.add.text(this.scale.width/2, this.scale.height/2 - 20, msg, { font: "32px Arial", fill: "#fff" })
            .setOrigin(0.5)
            .setDepth(2001);
        const btn = this.add.text(this.scale.width/2, this.scale.height/2 + 40, "Nouvelle partie", {
            font: "22px Arial",
            fill: "#fff",
            backgroundColor: "#28a",
            padding: { x: 18, y: 8 }
        })
        .setOrigin(0.5)
        .setDepth(2002)
        .setInteractive({ useHandCursor: true });
        btn.on("pointerdown", () => {
            window.location.reload();
        });
    }

    // Affiche la main d'énergies du joueur
    updatePlayerHandDisplay() {
        this.playerEnergyHandSprites.forEach(sprite => sprite.destroy());
        this.playerEnergyHandSprites = [];
        for (let i = 0; i < this.playerEnergyHand.length; i++) {
            let offset = i * 55;
            let card = this.add.image(this.playerHandX + offset, this.playerHandY, this.playerEnergyHand[i].id)
                .setDisplaySize(48, 68)
                .setOrigin(0.5);
            this.playerEnergyHandSprites.push(card);
        }
    }

    // Affiche la main d'énergies de l'IA (ancrée à droite, va vers la gauche)
    updateAiHandDisplay() {
        this.aiEnergyHandSprites.forEach(sprite => sprite.destroy());
        this.aiEnergyHandSprites = [];
        // Calcule la position de départ pour que la main reste visible
        const cardSpacing = 55;
        const totalWidth = (this.aiEnergyHand.length - 1) * cardSpacing;
        for (let i = 0; i < this.aiEnergyHand.length; i++) {
            let x = this.aiHandBaseX - totalWidth + i * cardSpacing;
            let card = this.add.image(x, this.aiHandY, this.aiEnergyHand[i].id)
                .setDisplaySize(48, 68)
                .setOrigin(0.5)
                .setTint(0xffa500);
            this.aiEnergyHandSprites.push(card);
        }
    }
}
